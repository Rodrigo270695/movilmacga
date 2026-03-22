<?php

namespace App\Http\Controllers\DCS;

use App\Exports\NegocioOperadorExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\NegocioOperadorSyncRequest;
use App\Models\Circuit;
use App\Models\Operator;
use App\Models\Pdv;
use App\Models\PdvBusinessType;
use App\Models\PdvBusinessTypeOperator;
use App\Models\Route;
use App\Models\User;
use App\Models\Zonal;
use App\Traits\HasBusinessScope;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class NegocioOperadorController extends Controller
{
    use HasBusinessScope;

    /**
     * Fecha "hoy" para visitas (misma lógica que API móvil / circuitos).
     * Zona horaria: Perú (America/Lima).
     */
    protected function todayDateString(): string
    {
        return Carbon::now('America/Lima')->format('Y-m-d');
    }

    /**
     * Fecha "hoy" para mostrar en la UI: dd/mmm/aaaa (mes abreviado en español, minúsculas).
     * Zona horaria: Perú (America/Lima).
     */
    protected function todayDateFormattedPeru(): string
    {
        $dt = Carbon::now('America/Lima');
        $months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

        return $dt->format('d').'/'.$months[(int) $dt->format('n') - 1].'/'.$dt->format('Y');
    }

    /**
     * Rutas permitidas hoy para un vendedor: circuitos asignados + visita programada hoy en route_visit_dates.
     *
     * @return \Illuminate\Support\Collection<int, int>
     */
    protected function vendorAllowedRouteIdsToday(User $user): \Illuminate\Support\Collection
    {
        $circuitIds = $user->activeUserCircuits()->pluck('circuit_id')->unique()->filter()->values();
        if ($circuitIds->isEmpty()) {
            return collect();
        }

        $today = $this->todayDateString();

        return Route::query()
            ->active()
            ->whereIn('circuit_id', $circuitIds)
            ->whereHas('visitDates', function ($q) use ($today) {
                $q->whereDate('visit_date', $today)->where('is_active', true);
            })
            ->pluck('id');
    }

    /**
     * Para vendedores: primera ruta del día (por nombre) → zonal, circuito y ruta por defecto en los filtros.
     *
     * @return array{zonal_id: ?string, circuit_id: ?string, route_id: ?string}
     */
    protected function vendorDefaultFilters(User $user): array
    {
        $routeIds = $this->vendorAllowedRouteIdsToday($user);
        if ($routeIds->isEmpty()) {
            return ['zonal_id' => null, 'circuit_id' => null, 'route_id' => null];
        }

        $route = Route::query()
            ->active()
            ->whereIn('id', $routeIds)
            ->with('circuit')
            ->orderBy('name')
            ->first();

        if (! $route || ! $route->circuit) {
            return ['zonal_id' => null, 'circuit_id' => null, 'route_id' => null];
        }

        $circuit = $route->circuit;

        return [
            'zonal_id' => $circuit->zonal_id !== null ? (string) $circuit->zonal_id : null,
            'circuit_id' => (string) $circuit->id,
            'route_id' => (string) $route->id,
        ];
    }

    /**
     * Si es vendedor y no envió ningún filtro jerárquico, aplica zonal/circuito/ruta por defecto (primera ruta del día).
     */
    protected function requestWithVendorDefaults(Request $request, User $user, bool $isVendor): Request
    {
        if (! $isVendor) {
            return $request;
        }

        if ($request->filled('zonal_id') || $request->filled('circuit_id') || $request->filled('route_id')) {
            return $request;
        }

        $defaults = $this->vendorDefaultFilters($user);
        if ($defaults['route_id'] === null) {
            return $request;
        }

        $query = array_merge($request->query->all(), [
            'zonal_id' => $defaults['zonal_id'],
            'circuit_id' => $defaults['circuit_id'],
            'route_id' => $defaults['route_id'],
        ]);

        return $request->duplicate($query);
    }

    /**
     * Query base de PDVs con relaciones y filtros de búsqueda / jerárquicos.
     */
    private function pdvsQuery(Request $request, User $user, bool $isVendor): Builder
    {
        $searchFilter = $request->get('search');
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');
        $routeFilter = $request->get('route_id');

        $query = Pdv::with([
            'route.circuit.zonal.business',
            'pdvBusinessTypes' => fn ($q) => $q->select('id', 'pdv_id', 'business_type'),
            'pdvBusinessTypes.businessTypeOperators' => fn ($q) => $q
                ->where('status', true)
                ->select('id', 'pdv_business_type_id', 'operator_id', 'sale_mode', 'status'),
            'pdvBusinessTypes.businessTypeOperators.operator' => fn ($q) => $q->select('id', 'name', 'color'),
        ])
            ->select(
                'id',
                'point_name',
                'pos_id',
                'document_type',
                'document_number',
                'client_name',
                'classification',
                'status',
                'route_id',
                'district_id',
                'locality',
                'created_at'
            );

        if ($isVendor) {
            $allowedRouteIds = $this->vendorAllowedRouteIdsToday($user);
            if ($allowedRouteIds->isEmpty()) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('route_id', $allowedRouteIds);
            }
        } else {
            $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');
        }

        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                    ->orWhere('client_name', 'like', "%{$searchFilter}%")
                    ->orWhere('document_number', 'like', "%{$searchFilter}%")
                    ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                    ->orWhereHas('route', fn ($r) => $r->where('name', 'like', "%{$searchFilter}%")->orWhere('code', 'like', "%{$searchFilter}%"));
            });
        }

        if ($businessFilter && ! $isVendor) {
            $query->whereHas('route.circuit.zonal', fn ($q) => $q->where('business_id', $businessFilter));
        }
        if ($zonalFilter) {
            $query->whereHas('route.circuit', fn ($q) => $q->where('zonal_id', $zonalFilter));
        }
        if ($circuitFilter) {
            $query->whereHas('route', fn ($q) => $q->where('circuit_id', $circuitFilter));
        }
        if ($routeFilter) {
            $query->where('route_id', $routeFilter);
        }

        return $query;
    }

    /**
     * PDVs con coordenadas y relaciones pdv_business_types / pdv_business_type_operators
     * (mismos filtros que {@see pdvsQuery()}).
     */
    protected function pdvsMapQueryBusinessTypes(Request $request, User $user, bool $isVendor): Builder
    {
        $searchFilter = $request->get('search');
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');
        $routeFilter = $request->get('route_id');
        $businessTypeFilter = $request->get('business_type');

        $query = Pdv::with([
            'route.circuit.zonal.business',
            'pdvBusinessTypes' => fn ($q) => $q
                ->select('id', 'pdv_id', 'business_type')
                ->when(
                    $businessTypeFilter && in_array($businessTypeFilter, NegocioOperadorSyncRequest::businessTypeValues(), true),
                    fn ($sub) => $sub->where('business_type', $businessTypeFilter)
                ),
            'pdvBusinessTypes.businessTypeOperators' => fn ($q) => $q
                ->where('status', true)
                ->select('id', 'pdv_business_type_id', 'operator_id', 'sale_mode', 'status'),
            'pdvBusinessTypes.businessTypeOperators.operator' => fn ($q) => $q->select('id', 'name', 'color'),
        ])
            ->select('id', 'point_name', 'client_name', 'latitude', 'longitude', 'route_id')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        if ($isVendor) {
            $allowedRouteIds = $this->vendorAllowedRouteIdsToday($user);
            if ($allowedRouteIds->isEmpty()) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('route_id', $allowedRouteIds);
            }
        } else {
            $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');
        }

        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                    ->orWhere('client_name', 'like', "%{$searchFilter}%")
                    ->orWhere('document_number', 'like', "%{$searchFilter}%")
                    ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                    ->orWhereHas('route', fn ($r) => $r->where('name', 'like', "%{$searchFilter}%")->orWhere('code', 'like', "%{$searchFilter}%"));
            });
        }

        if ($businessFilter && ! $isVendor) {
            $query->whereHas('route.circuit.zonal', fn ($q) => $q->where('business_id', $businessFilter));
        }
        if ($zonalFilter) {
            $query->whereHas('route.circuit', fn ($q) => $q->where('zonal_id', $zonalFilter));
        }
        if ($circuitFilter) {
            $query->whereHas('route', fn ($q) => $q->where('circuit_id', $circuitFilter));
        }
        if ($routeFilter) {
            $query->where('route_id', $routeFilter);
        }

        if ($businessTypeFilter && in_array($businessTypeFilter, NegocioOperadorSyncRequest::businessTypeValues(), true)) {
            $query->whereHas('pdvBusinessTypes', fn ($q) => $q->where('business_type', $businessTypeFilter));
        }

        return $query;
    }

    private function assertPdvAccessible(int $pdvId, User $user, bool $isVendor): void
    {
        $query = Pdv::query()->whereKey($pdvId);
        if ($isVendor) {
            $allowed = $this->vendorAllowedRouteIdsToday($user);
            if ($allowed->isEmpty()) {
                abort(403, 'No tienes permiso para modificar este PDV.');
            }
            $query->whereIn('route_id', $allowed);
        } else {
            $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');
        }
        if (! $query->exists()) {
            abort(403, 'No tienes permiso para modificar este PDV.');
        }
    }

    /**
     * Opciones de tipos de negocio (mismo enum que pdv_business_types).
     *
     * @return array<int, array{value: string, label: string}>
     */
    protected function businessTypeOptionsForFrontend(): array
    {
        $labels = [
            'Telco' => 'Telco',
            'Bodega' => 'Bodega',
            'Agente' => 'Agente',
            'Market' => 'Market',
            'Servicio Técnico' => 'Servicio técnico',
            'Otros' => 'Otros',
            'Exclusivo' => 'Exclusivo',
        ];

        return collect(NegocioOperadorSyncRequest::businessTypeValues())
            ->map(fn (string $v) => ['value' => $v, 'label' => $labels[$v] ?? $v])
            ->values()
            ->all();
    }

    /**
     * Opciones de filtros para vendedor: solo zonales/circuitos/rutas con visita hoy en circuitos asignados.
     *
     * @return array{allZonales: array, allCircuits: \Illuminate\Support\Collection, allRoutes: \Illuminate\Support\Collection}
     */
    protected function filterOptionsForVendor(User $user): array
    {
        $routeIds = $this->vendorAllowedRouteIdsToday($user);
        if ($routeIds->isEmpty()) {
            return [
                'allZonales' => [],
                'allCircuits' => collect(),
                'allRoutes' => collect(),
            ];
        }

        $routes = Route::query()
            ->active()
            ->whereIn('id', $routeIds)
            ->with(['circuit.zonal.business'])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'circuit_id']);

        $circuitIds = $routes->pluck('circuit_id')->unique()->filter()->values();
        $circuits = Circuit::query()
            ->active()
            ->whereIn('id', $circuitIds)
            ->with('zonal.business')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'zonal_id']);

        $zonalIds = $circuits->pluck('zonal_id')->unique()->filter()->values();
        $zonales = Zonal::query()
            ->where('status', true)
            ->whereIn('id', $zonalIds)
            ->orderBy('name')
            ->get(['id', 'name', 'business_id'])
            ->toArray();

        return [
            'allZonales' => $zonales,
            'allCircuits' => $circuits,
            'allRoutes' => $routes,
        ];
    }

    /**
     * Opciones de filtros para no vendedor (scope de negocio vía HasBusinessScope + middleware).
     */
    protected function filterOptionsForStaff(): array
    {
        $businessScope = $this->getBusinessScope();
        $cacheKey = 'negocio_operador_filters_'.md5(json_encode($businessScope));
        $cached = Cache::remember($cacheKey, 300, function () {
            $circuitsQuery = Circuit::active()->with('zonal.business')->orderBy('name');
            $circuitsQuery = $this->applyFullScope($circuitsQuery, 'zonal.business', 'zonal');

            $routesQuery = Route::active()->with('circuit.zonal.business')->orderBy('name');
            $routesQuery = $this->applyFullScope($routesQuery, 'circuit.zonal.business', 'circuit.zonal');

            return [
                'allCircuits' => $circuitsQuery->get(['id', 'name', 'code', 'zonal_id']),
                'allRoutes' => $routesQuery->get(['id', 'name', 'code', 'circuit_id']),
            ];
        });

        $businesses = $this->getAvailableBusinesses()->toArray();
        $allZonales = $this->getAvailableZonals()->toArray();

        return [
            'businesses' => $businesses,
            'allZonales' => $allZonales,
            'allCircuits' => $cached['allCircuits'],
            'allRoutes' => $cached['allRoutes'],
        ];
    }

    public function index(Request $request): Response
    {
        if (! Auth::user()?->can('gestor-negocio-operador-ver')) {
            abort(403, 'No tienes permisos para ver Negocio - Operador.');
        }

        $user = Auth::user();
        $isVendor = $user->hasRole('Vendedor');

        $perPage = (int) $request->get('per_page', 50);

        $requestForQuery = $this->requestWithVendorDefaults($request, $user, $isVendor);

        $query = $this->pdvsQuery($requestForQuery, $user, $isVendor);
        $pdvs = $query->orderBy('point_name')->paginate($perPage);

        $pdvs->getCollection()->transform(function (Pdv $pdv) {
            $pdv->setAttribute(
                'business_types',
                $pdv->pdvBusinessTypes->pluck('business_type')->values()->all()
            );

            $prepago = collect();
            $pospago = collect();
            foreach ($pdv->pdvBusinessTypes as $pbt) {
                foreach ($pbt->businessTypeOperators as $bto) {
                    if (! $bto->status) {
                        continue;
                    }
                    $op = $bto->operator;
                    if (! $op) {
                        continue;
                    }
                    $row = [
                        'id' => $op->id,
                        'name' => $op->name,
                        'color' => $op->color,
                    ];
                    if ($bto->sale_mode === PdvBusinessTypeOperator::SALE_PREPAGO) {
                        $prepago->push($row);
                    } elseif ($bto->sale_mode === PdvBusinessTypeOperator::SALE_POSPAGO) {
                        $pospago->push($row);
                    }
                }
            }
            $pdv->setAttribute(
                'prepago_operators',
                $prepago->unique('id')->values()->all()
            );
            $pdv->setAttribute(
                'pospago_operators',
                $pospago->unique('id')->values()->all()
            );

            $pdv->unsetRelation('pdvBusinessTypes');

            return $pdv;
        });

        $pagePdvIds = $pdvs->getCollection()->pluck('id');
        $pageHasSavedBusinessTypes = $pagePdvIds->isNotEmpty()
            && PdvBusinessType::query()->whereIn('pdv_id', $pagePdvIds)->exists();

        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        if ($isVendor) {
            $opts = $this->filterOptionsForVendor($user);
            $businesses = [];
            $allZonalesArr = $opts['allZonales'];
            $allCircuits = $opts['allCircuits'];
            $allRoutes = $opts['allRoutes'];
        } else {
            $opts = $this->filterOptionsForStaff();
            $businesses = $opts['businesses'];
            $allZonalesArr = $opts['allZonales'];
            $allCircuits = $opts['allCircuits'];
            $allRoutes = $opts['allRoutes'];
        }

        return Inertia::render('dcs/negocio-operador/global-index', [
            'pdvs' => $pdvs,
            'businesses' => $businesses,
            'allZonales' => $allZonalesArr,
            'allCircuits' => $allCircuits instanceof \Illuminate\Support\Collection ? $allCircuits->values()->toArray() : $allCircuits,
            'allRoutes' => $allRoutes instanceof \Illuminate\Support\Collection ? $allRoutes->values()->toArray() : $allRoutes,
            'isVendor' => $isVendor,
            'visitDateTodayFormatted' => $this->todayDateFormattedPeru(),
            'businessTypeOptions' => $this->businessTypeOptionsForFrontend(),
            'operators' => $operators,
            'pageHasSavedBusinessTypes' => $pageHasSavedBusinessTypes,
            'filters' => [
                'search' => $request->get('search'),
                'business_id' => $isVendor ? null : $request->get('business_id'),
                'zonal_id' => $requestForQuery->get('zonal_id'),
                'circuit_id' => $requestForQuery->get('circuit_id'),
                'route_id' => $requestForQuery->get('route_id'),
            ],
            'flash' => fn () => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Guarda tipos de negocio por PDV (pdv_business_types) y operadores prepago/pospago
     * por tipo (pdv_business_type_operators), replicando la matriz en cada tipo del PDV.
     */
    public function sync(NegocioOperadorSyncRequest $request)
    {
        $user = Auth::user();
        $isVendor = $user->hasRole('Vendedor');

        $selections = $request->selections();
        $operatorModes = $request->operatorModes();

        $validOperatorIds = Operator::active()->pluck('id')->flip();

        DB::transaction(function () use ($selections, $operatorModes, $user, $isVendor, $validOperatorIds) {
            foreach ($selections as $pdvId => $types) {
                $id = (int) $pdvId;
                $this->assertPdvAccessible($id, $user, $isVendor);

                PdvBusinessType::query()->where('pdv_id', $id)->delete();

                $modesForPdv = $operatorModes[(string) $id] ?? [];

                foreach ($types as $type) {
                    $pbt = PdvBusinessType::query()->create([
                        'pdv_id' => $id,
                        'business_type' => $type,
                    ]);

                    foreach ($modesForPdv as $operatorIdStr => $flags) {
                        $operatorId = (int) $operatorIdStr;
                        if ($operatorId <= 0 || ! $validOperatorIds->has($operatorId)) {
                            continue;
                        }
                        if (! empty($flags['prepago'])) {
                            PdvBusinessTypeOperator::query()->create([
                                'pdv_business_type_id' => $pbt->id,
                                'operator_id' => $operatorId,
                                'sale_mode' => PdvBusinessTypeOperator::SALE_PREPAGO,
                                'status' => true,
                            ]);
                        }
                        if (! empty($flags['pospago'])) {
                            PdvBusinessTypeOperator::query()->create([
                                'pdv_business_type_id' => $pbt->id,
                                'operator_id' => $operatorId,
                                'sale_mode' => PdvBusinessTypeOperator::SALE_POSPAGO,
                                'status' => true,
                            ]);
                        }
                    }
                }
            }
        });

        return back()->with('success', 'Tipos de negocio y operadores guardados correctamente.');
    }

    public function export(Request $request)
    {
        if (! Auth::user()?->can('gestor-negocio-operador-ver')) {
            abort(403);
        }

        $user = Auth::user();
        $isVendor = $user->hasRole('Vendedor');

        $requestForQuery = $this->requestWithVendorDefaults($request, $user, $isVendor);

        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        $rows = $this->pdvsQuery($requestForQuery, $user, $isVendor)
            ->with([
                'route.circuit.userCircuits.user',
                'pdvBusinessTypes' => fn ($q) => $q->select('id', 'pdv_id', 'business_type'),
                'pdvBusinessTypes.businessTypeOperators' => fn ($q) => $q
                    ->where('status', true)
                    ->select('id', 'pdv_business_type_id', 'operator_id', 'sale_mode', 'status'),
            ])
            ->orderBy('point_name')
            ->get();

        $filename = 'negocio_operador_'.now()->format('Y-m-d_H-i-s').'.xlsx';

        return Excel::download(new NegocioOperadorExport($rows, $operators, $isVendor), $filename);
    }
}
