<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\PdvRequest;
use App\Models\Pdv;
use App\Models\Route;
use App\Models\Zonal;
use App\Models\Circuit;
use App\Models\Localidad;
use App\Traits\HasBusinessScope;
use App\Exports\PdvsExport;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class GlobalPdvController extends Controller
{
    use HasBusinessScope;
        /**
     * Generate a unique 6-digit POS ID
     */
    private function generateUniquePosId(): string
    {
        $maxAttempts = 100; // Evitar bucles infinitos
        $attempts = 0;

        do {
            // Generar un número de 6 dígitos (100000 - 999999)
            $posId = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Verificar que no exista en la base de datos
            $exists = Pdv::where('pos_id', $posId)->exists();
            $attempts++;

            // Failsafe: si llegamos al límite de intentos, usar timestamp
            if ($attempts >= $maxAttempts) {
                $posId = substr(str_replace('.', '', microtime(true)), -6);
                break;
            }

        } while ($exists);

        return $posId;
    }

    /**
     * Display a global listing of PDVs with filters.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!Auth::user()?->can('gestor-pdv-ver')) {
            abort(403, 'No tienes permisos para ver los PDVs.');
        }

        $perPage = $request->get('per_page', 10);

        // Filtros básicos
        $searchFilter = $request->get('search');
        $routeFilter = $request->get('route_id');
        $districtFilter = $request->get('district_id');
        $localityTextFilter = $request->get('locality');
        $statusFilter = $request->get('status');
        $classificationFilter = $request->get('classification');

        // Filtros jerárquicos
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');
        $routeFilter = $request->get('route_id');

        // Filtros básicos
        $statusFilter = $request->get('status');
        $classificationFilter = $request->get('classification');

        $query = Pdv::with(['route.circuit.zonal.business', 'district'])
            ->select('id', 'point_name', 'pos_id', 'document_type', 'document_number', 'client_name', 'classification', 'status', 'route_id', 'district_id', 'locality', 'sells_recharge', 'created_at');

        // Aplicar filtros de scope automáticos (negocio y zonal)
        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        // Búsqueda general (search)
        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                  ->orWhere('client_name', 'like', "%{$searchFilter}%")
                  ->orWhere('document_number', 'like', "%{$searchFilter}%")
                  ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                  ->orWhere('status', 'like', "%{$searchFilter}%")
                  ->orWhere('classification', 'like', "%{$searchFilter}%")
                  ->orWhere('locality', 'like', "%{$searchFilter}%")
                  ->orWhereHas('route', function ($routeQuery) use ($searchFilter) {
                      $routeQuery->where('name', 'like', "%{$searchFilter}%")
                                 ->orWhere('code', 'like', "%{$searchFilter}%");
                  });
            });
        }

        // Filtros básicos
        if ($routeFilter) {
            $query->byRoute($routeFilter);
        }

        if ($districtFilter) {
            $query->byDistrict($districtFilter);
        }

        if ($localityTextFilter) {
            $query->byLocalityText($localityTextFilter);
        }

        if ($statusFilter) {
            $query->byStatus($statusFilter);
        }

        if ($classificationFilter) {
            $query->byClassification($classificationFilter);
        }

        // Filtros jerárquicos
        if ($businessFilter) {
            $query->whereHas('route.circuit.zonal', function ($q) use ($businessFilter) {
                $q->where('business_id', $businessFilter);
            });
        }

        if ($zonalFilter) {
            $query->whereHas('route.circuit', function ($q) use ($zonalFilter) {
                $q->where('zonal_id', $zonalFilter);
            });
        }

        if ($circuitFilter) {
            $query->whereHas('route', function ($routeQuery) use ($circuitFilter) {
                $routeQuery->where('circuit_id', $circuitFilter);
            });
        }

        if ($routeFilter) {
            $query->where('route_id', $routeFilter);
        }

        $pdvs = $query->orderBy('point_name')->paginate($perPage);

        // OPTIMIZACIÓN: Usar caché para opciones de filtros (TTL: 5 minutos)
        $businessScope = $this->getBusinessScope();
        $cacheKey = 'pdv_filter_options_' . md5(json_encode($businessScope));
        $filterOptions = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () {
            return [
                'businesses' => $this->getAvailableBusinesses()->toArray(),
                'allZonales' => $this->getAvailableZonals()->toArray(),
            ];
        });

        // Cargar datos para los filtros jerárquicos (desde caché)
        $businesses = $filterOptions['businesses'];
        $allZonales = $filterOptions['allZonales'];

        // Filtrar zonales por negocio seleccionado solo para la vista
        $zonales = $this->getAvailableZonals();
        if ($businessFilter) {
            $zonales = $zonales->where('business_id', $businessFilter);
        }
        $zonales = $zonales->toArray();

        // OPTIMIZACIÓN: Cargar circuitos y rutas desde caché extendido
        $circuitsCacheKey = 'pdv_circuits_' . md5(json_encode($businessScope));
        $routesCacheKey = 'pdv_routes_' . md5(json_encode($businessScope));
        
        $allCircuits = \Illuminate\Support\Facades\Cache::remember($circuitsCacheKey, 300, function () {
            $allCircuitsQuery = \App\Models\Circuit::active()->with('zonal.business')->orderBy('name');
            $allCircuitsQuery = $this->applyFullScope($allCircuitsQuery, 'zonal.business', 'zonal');
            return $allCircuitsQuery->get(['id', 'name', 'code', 'zonal_id']);
        });

        $allRoutes = \Illuminate\Support\Facades\Cache::remember($routesCacheKey, 300, function () {
            $allRoutesQuery = Route::active()->with('circuit.zonal.business')->orderBy('name');
            $allRoutesQuery = $this->applyFullScope($allRoutesQuery, 'circuit.zonal.business', 'circuit.zonal');
            return $allRoutesQuery->get(['id', 'name', 'code', 'circuit_id']);
        });

        // Filtrar circuitos en memoria desde caché
        $circuits = $allCircuits;
        if ($businessFilter) {
            $circuits = $circuits->filter(function ($circuit) use ($businessFilter) {
                return $circuit->zonal && $circuit->zonal->business_id == $businessFilter;
            });
        }
        if ($zonalFilter) {
            $circuits = $circuits->where('zonal_id', $zonalFilter);
        }
        $circuits = $circuits->values();

        // Filtrar rutas en memoria desde caché
        $routes = $allRoutes;
        if ($businessFilter) {
            $routes = $routes->filter(function ($route) use ($businessFilter) {
                return $route->circuit && $route->circuit->zonal && 
                       $route->circuit->zonal->business_id == $businessFilter;
            });
        }
        if ($zonalFilter) {
            $routes = $routes->filter(function ($route) use ($zonalFilter) {
                return $route->circuit && $route->circuit->zonal_id == $zonalFilter;
            });
        }
        if ($circuitFilter) {
            $routes = $routes->where('circuit_id', $circuitFilter);
        }
        $routes = $routes->values();

        $departamentos = \App\Models\Departamento::where('status', true)->orderBy('name')->get(['id', 'name', 'pais_id']);

        return Inertia::render('dcs/pdvs/global-index', [
            'pdvs' => $pdvs,
            'businesses' => $businesses,
            'zonales' => $zonales,
            'allZonales' => $allZonales,
            'allCircuits' => $allCircuits,
            'circuits' => $circuits,
            'allRoutes' => $allRoutes,
            'routes' => $routes,
            'departamentos' => $departamentos,
            'businessScope' => $this->getBusinessScope(),
            'filters' => [
                'search' => $searchFilter,
                'business_id' => $businessFilter,
                'zonal_id' => $zonalFilter,
                'circuit_id' => $circuitFilter,
                'route_id' => $routeFilter,
                'status' => $statusFilter,
                'classification' => $classificationFilter,
            ],
            'flash' => fn () => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Obtener provincias por departamento (AJAX)
     */
    public function getProvinciasByDepartamento(Request $request)
    {
        $departamentoId = $request->input('departamento_id');

        if (!$departamentoId) {
            return response()->json([]);
        }

        $provincias = \App\Models\Provincia::where('status', true)
            ->where('departamento_id', $departamentoId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($provincias);
    }

    /**
     * Obtener distritos por provincia (AJAX)
     */
    public function getDistritosByProvincia(Request $request)
    {
        $provinciaId = $request->input('provincia_id');

        if (!$provinciaId) {
            return response()->json([]);
        }

        $distritos = \App\Models\Distrito::where('status', true)
            ->where('provincia_id', $provinciaId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($distritos);
    }

    /**
     * Buscar localidades por distrito con filtro de texto (AJAX)
     */
    public function searchLocalidades(Request $request)
    {
        $distritoId = $request->input('distrito_id');
        $search = $request->input('search', '');

        if (!$distritoId) {
            return response()->json([]);
        }

        $query = Localidad::where('status', true)
            ->where('distrito_id', $distritoId);

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        // Limitar a 50 resultados para evitar sobrecarga
        $localidades = $query->orderBy('name')
            ->limit(50)
            ->get(['id', 'name']);

        return response()->json($localidades);
    }

    /**
     * Obtener rutas por circuito (AJAX)
     */
    public function getRoutesByCircuit(Request $request)
    {
        $circuitId = $request->input('circuit_id');

        if (!$circuitId) {
            return response()->json([]);
        }

        $routes = Route::active()
            ->where('circuit_id', $circuitId)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json($routes);
    }

    /**
     * Obtener detalles completos del PDV para edición (AJAX)
     */
    public function getPdvDetails(Pdv $pdv)
    {
        // Cargar PDV con todas las relaciones necesarias
        $pdv->load([
            'route.circuit',
            'district.provincia.departamento'
        ]);

        return response()->json([
            'id' => $pdv->id,
            'point_name' => $pdv->point_name,
            'pos_id' => $pdv->pos_id,
            'document_type' => $pdv->document_type,
            'document_number' => $pdv->document_number,
            'client_name' => $pdv->client_name,
            'phone' => $pdv->phone,
            'classification' => $pdv->classification,
            'status' => $pdv->status,
            'sells_recharge' => $pdv->sells_recharge,
            'address' => $pdv->address,
            'reference' => $pdv->reference,
            'latitude' => $pdv->latitude,
            'longitude' => $pdv->longitude,
            'route_id' => $pdv->route_id,
            'district_id' => $pdv->district_id,
            'locality' => $pdv->locality,
            // IDs para cargar las listas dependientes
            'zonal_id' => $pdv->route?->circuit?->zonal_id,
            'circuit_id' => $pdv->route?->circuit_id,
            'departamento_id' => $pdv->district?->provincia?->departamento_id,
            'provincia_id' => $pdv->district?->provincia_id,
        ]);
    }

    /**
     * Obtener PDVs de una ruta específica para mostrar en el mapa (AJAX)
     * Solo PDVs con estado "vende" (activos)
     */
    public function getRoutePdvs(Route $route)
    {
        // Obtener PDVs activos (solo con estado "vende") con la información necesaria para el mapa
        $pdvs = $route->pdvs()
            ->with(['district'])
            ->where('status', 'vende') // Solo PDVs que venden
            ->select([
                'id',
                'point_name',
                'client_name',
                'pos_id',
                'address',
                'latitude',
                'longitude',
                'status',
                'district_id',
                'locality',
            ])
            ->orderBy('id') // Ordenar por ID para mantener el orden de creación
            ->get();

        return response()->json([
            'success' => true,
            'pdvs' => $pdvs,
            'route' => [
                'id' => $route->id,
                'name' => $route->name,
                'code' => $route->code,
                'circuit' => $route->circuit ? [
                    'id' => $route->circuit->id,
                    'name' => $route->circuit->name,
                    'zonal' => $route->circuit->zonal ? [
                        'id' => $route->circuit->zonal->id,
                        'name' => $route->circuit->zonal->name
                    ] : null
                ] : null
            ],
            'stats' => [
                'total' => $pdvs->count(),
                'active' => $pdvs->where('status', 'vende')->count(),
                'inactive' => $pdvs->where('status', '!=', 'vende')->count(),
                'with_coordinates' => $pdvs->whereNotNull('latitude')->whereNotNull('longitude')->count()
            ]
        ]);
    }

    /**
     * Obtener PDVs de un zonal específico para mostrar en el mapa (AJAX)
     * Filtros opcionales por circuitos y rutas
     * Solo PDVs con estado "vende" (activos)
     */
    public function getZonalPdvs(Request $request, Zonal $zonal)
    {
        // Obtener filtros opcionales
        $circuitIds = $request->get('circuit_ids', []);
        $routeIds = $request->get('route_ids', []);

        // Si vienen como string (query params), convertirlos a array
        if (is_string($circuitIds)) {
            $circuitIds = explode(',', $circuitIds);
            $circuitIds = array_filter(array_map('intval', $circuitIds));
        }
        if (is_string($routeIds)) {
            $routeIds = explode(',', $routeIds);
            $routeIds = array_filter(array_map('intval', $routeIds));
        }

        // Construir query base: PDVs del zonal con estado "vende"
        $query = Pdv::with(['route.circuit.zonal', 'district'])
            ->where('status', 'vende')
            ->whereHas('route.circuit', function ($circuitQuery) use ($zonal, $circuitIds) {
                $circuitQuery->where('zonal_id', $zonal->id);
                
                // Filtrar por circuitos si se especifican
                if (!empty($circuitIds)) {
                    $circuitQuery->whereIn('id', $circuitIds);
                }
            });

        // Filtrar por rutas si se especifican
        if (!empty($routeIds)) {
            $query->whereIn('route_id', $routeIds);
        }

        // Obtener PDVs con información necesaria para el mapa
        $pdvs = $query
            ->select([
                'id',
                'point_name',
                'client_name',
                'pos_id',
                'address',
                'latitude',
                'longitude',
                'status',
                'route_id',
                'district_id',
                'locality',
            ])
            ->orderBy('route_id')
            ->orderBy('id')
            ->get();

        // Cargar información de circuitos y rutas del zonal para los filtros
        $circuits = Circuit::where('zonal_id', $zonal->id)
            ->where('status', true)
            ->with(['routes' => function ($query) {
                $query->where('status', true)->select('id', 'name', 'code', 'circuit_id');
            }])
            ->select('id', 'name', 'code', 'zonal_id')
            ->orderBy('name')
            ->get();

        // Agrupar PDVs por circuito para estadísticas
        $pdvsByCircuit = [];
        foreach ($pdvs as $pdv) {
            $circuitId = $pdv->route?->circuit?->id;
            if ($circuitId) {
                if (!isset($pdvsByCircuit[$circuitId])) {
                    $pdvsByCircuit[$circuitId] = 0;
                }
                $pdvsByCircuit[$circuitId]++;
            }
        }

        return response()->json([
            'success' => true,
            'pdvs' => $pdvs->map(function ($pdv) {
                return [
                    'id' => $pdv->id,
                    'point_name' => $pdv->point_name,
                    'client_name' => $pdv->client_name,
                    'pos_id' => $pdv->pos_id,
                    'address' => $pdv->address,
                    'latitude' => $pdv->latitude,
                    'longitude' => $pdv->longitude,
                    'status' => $pdv->status,
                    'district_id' => $pdv->district_id,
                    'locality' => $pdv->locality,
                    'route_id' => $pdv->route_id,
                    'circuit_id' => $pdv->route?->circuit?->id,
                    'circuit_name' => $pdv->route?->circuit?->name,
                    'circuit_code' => $pdv->route?->circuit?->code,
                    'route_name' => $pdv->route?->name,
                    'route_code' => $pdv->route?->code,
                ];
            }),
            'zonal' => [
                'id' => $zonal->id,
                'name' => $zonal->name,
            ],
            'circuits' => $circuits->map(function ($circuit) {
                return [
                    'id' => $circuit->id,
                    'name' => $circuit->name,
                    'code' => $circuit->code,
                    'routes' => $circuit->routes->map(function ($route) {
                        return [
                            'id' => $route->id,
                            'name' => $route->name,
                            'code' => $route->code,
                        ];
                    }),
                ];
            }),
            'stats' => [
                'total' => $pdvs->count(),
                'with_coordinates' => $pdvs->whereNotNull('latitude')->whereNotNull('longitude')->count(),
                'by_circuit' => $pdvsByCircuit,
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage (global).
     */
    public function store(PdvRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-crear')) {
            abort(403, 'No tienes permisos para crear PDVs.');
        }

        // Usar POS ID del request si está presente, sino generar uno automáticamente
        $posId = $request->filled('pos_id')
            ? $request->pos_id
            : $this->generateUniquePosId();

        $pdv = Pdv::create([
            'point_name' => $request->point_name,
            'pos_id' => $posId,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'client_name' => $request->client_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'sells_recharge' => $request->sells_recharge ?? false,
            'classification' => $request->classification,
            'status' => $request->status,
            'address' => $request->address,
            'reference' => $request->reference,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'route_id' => $request->route_id,
            'district_id' => $request->district_id,
            'locality' => $request->locality,
        ]);

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdv->point_name}' creado exitosamente con POS ID: {$pdv->pos_id}");
    }

    /**
     * Update the specified resource in storage (global).
     */
    public function update(PdvRequest $request, Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-editar')) {
            abort(403, 'No tienes permisos para editar PDVs.');
        }

        // Determinar POS ID: usar el del request si está presente, sino mantener el existente, o generar uno nuevo
        $posId = $request->filled('pos_id')
            ? $request->pos_id
            : ($pdv->pos_id ?: $this->generateUniquePosId());

        $pdv->update([
            'point_name' => $request->point_name,
            'pos_id' => $posId,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'client_name' => $request->client_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'sells_recharge' => $request->sells_recharge ?? false,
            'classification' => $request->classification,
            'status' => $request->status,
            'address' => $request->address,
            'reference' => $request->reference,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'route_id' => $request->route_id,
            'district_id' => $request->district_id,
            'locality' => $request->locality,
        ]);

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdv->point_name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource (global).
     */
    public function toggleStatus(Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de PDVs.');
        }

        // Determinar nuevo status (ciclar entre los estados principales)
        $newStatus = match($pdv->status) {
            'vende' => 'no vende',
            'no vende' => 'vende',
            default => 'vende'
        };

        // Hacer el update
        $pdv->status = $newStatus;
        $pdv->save();

        $statusText = $pdv->status_label;

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "El estado del PDV '{$pdv->point_name}' ha sido cambiado a '{$statusText}' exitosamente.");
        }

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "El estado del PDV '{$pdv->point_name}' ha sido cambiado a '{$statusText}' exitosamente.");
    }

    /**
     * Remove the specified resource from storage (global).
     */
    public function destroy(Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-eliminar')) {
            abort(403, 'No tienes permisos para eliminar PDVs.');
        }

        $pdvName = $pdv->point_name;
        $pdv->delete();

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdvName}' eliminado exitosamente.");
    }

    /**
     * Export PDVs to Excel with applied filters.
     */
    public function export(Request $request)
    {
        try {
            // Verificar permisos
            if (!auth()->user()->can('gestor-pdv-ver')) {
                abort(403, 'No tienes permisos para exportar PDVs.');
            }

            // Recopilar todos los filtros aplicados
            $filters = [
                'search' => $request->get('search'),
                'business_id' => $request->get('business_id'),
                'zonal_id' => $request->get('zonal_id'),
                'circuit_id' => $request->get('circuit_id'),
                'route_id' => $request->get('route_id'),
            ];

            // Generar nombre del archivo con timestamp
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "pdvs_export_{$timestamp}.xlsx";

            // Log para debug
            Log::info('Iniciando exportación de PDVs', ['filters' => $filters]);

            return Excel::download(new PdvsExport($filters), $filename);

        } catch (\Exception $e) {
            Log::error('Error en exportación de PDVs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Si es una petición AJAX, devolver JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Error al exportar: ' . $e->getMessage()
                ], 500);
            }

            // Si no, redirigir con error
            return redirect()->route('dcs.pdvs.index')
                ->with('error', 'Error al exportar: ' . $e->getMessage());
        }
    }

    /**
     * Get circuits by zonal for AJAX requests.
     */
    public function getCircuitsByZonal(Request $request)
    {
        $zonalId = $request->get('zonal_id');

        if (!$zonalId) {
            return response()->json([]);
        }

        // Obtener circuitos del zonal aplicando scope
        $circuitsQuery = \App\Models\Circuit::active()
            ->where('zonal_id', $zonalId)
            ->orderBy('name');

        // Aplicar scope de negocio y zonal
        $circuitsQuery = $this->applyFullScope($circuitsQuery, 'zonal.business', 'zonal');

        $circuits = $circuitsQuery->get(['id', 'name', 'code', 'zonal_id']);

        return response()->json($circuits);
    }
}
