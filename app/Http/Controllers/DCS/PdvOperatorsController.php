<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\PdvOperatorsSyncRequest;
use App\Models\Pdv;
use App\Models\Operator;
use App\Models\Route;
use App\Traits\HasBusinessScope;
use App\Exports\PdvsOperatorsExport;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class PdvOperatorsController extends Controller
{
    use HasBusinessScope;

    /**
     * Display PDVs with operator assignment columns (same filters as global PDVs).
     */
    public function index(Request $request)
    {
        if (!Auth::user()?->can('gestor-pdv-operadores-ver')) {
            abort(403, 'No tienes permisos para ver la asignación PDV-Operadores.');
        }

        $perPage = $request->get('per_page', 50);
        $searchFilter = $request->get('search');
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');
        $routeFilter = $request->get('route_id');
        $statusFilter = $request->get('status');
        $classificationFilter = $request->get('classification');

        $query = Pdv::with([
            'route.circuit.zonal.business',
            'district',
            'operators' => fn ($q) => $q->withPivot('status'),
        ])
            ->select('id', 'point_name', 'pos_id', 'document_type', 'document_number', 'client_name', 'classification', 'status', 'route_id', 'district_id', 'locality', 'sells_recharge', 'latitude', 'longitude', 'created_at');

        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                    ->orWhere('client_name', 'like', "%{$searchFilter}%")
                    ->orWhere('document_number', 'like', "%{$searchFilter}%")
                    ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                    ->orWhereHas('route', fn ($r) => $r->where('name', 'like', "%{$searchFilter}%")->orWhere('code', 'like', "%{$searchFilter}%"));
            });
        }

        if ($businessFilter) {
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
        if ($statusFilter) {
            $query->byStatus($statusFilter);
        }
        if ($classificationFilter) {
            $query->byClassification($classificationFilter);
        }

        $pdvs = $query->orderBy('point_name')->paginate($perPage);

        $businessScope = $this->getBusinessScope();
        $businesses = $this->getAvailableBusinesses()->toArray();
        $allZonales = $this->getAvailableZonals()->toArray();
        $zonales = collect($allZonales);
        if ($businessFilter) {
            $zonales = $zonales->where('business_id', (int) $businessFilter);
        }
        $zonales = $zonales->values()->toArray();

        $allCircuits = \Illuminate\Support\Facades\Cache::remember('pdv_operators_circuits_' . md5(json_encode($businessScope)), 300, function () {
            $q = \App\Models\Circuit::active()->with('zonal.business')->orderBy('name');
            return $this->applyFullScope($q, 'zonal.business', 'zonal')->get(['id', 'name', 'code', 'zonal_id']);
        });
        $allRoutes = \Illuminate\Support\Facades\Cache::remember('pdv_operators_routes_' . md5(json_encode($businessScope)), 300, function () {
            $q = Route::active()->with('circuit.zonal.business')->orderBy('name');
            return $this->applyFullScope($q, 'circuit.zonal.business', 'circuit.zonal')->get(['id', 'name', 'code', 'circuit_id']);
        });

        $circuits = $allCircuits;
        if ($businessFilter) {
            $circuits = $circuits->filter(fn ($c) => $c->zonal && $c->zonal->business_id == $businessFilter)->values();
        }
        if ($zonalFilter) {
            $circuits = $circuits->where('zonal_id', $zonalFilter)->values();
        }
        $routes = $allRoutes;
        if ($businessFilter) {
            $routes = $routes->filter(fn ($r) => $r->circuit && $r->circuit->zonal && $r->circuit->zonal->business_id == $businessFilter)->values();
        }
        if ($zonalFilter) {
            $routes = $routes->filter(fn ($r) => $r->circuit && $r->circuit->zonal_id == $zonalFilter)->values();
        }
        if ($circuitFilter) {
            $routes = $routes->where('circuit_id', $circuitFilter)->values();
        }

        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('dcs/pdv-operators/global-index', [
            'pdvs' => $pdvs,
            'operators' => $operators,
            'businesses' => $businesses,
            'zonales' => $zonales,
            'allZonales' => $allZonales,
            'allCircuits' => $allCircuits,
            'circuits' => $circuits,
            'allRoutes' => $allRoutes,
            'routes' => $routes,
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
     * Sync PDV-Operator assignments (checkboxes).
     */
    public function sync(PdvOperatorsSyncRequest $request)
    {
        $assignments = $request->validated('assignments');

        foreach ($assignments as $a) {
            \App\Models\PdvOperator::updateOrCreate(
                [
                    'pdv_id' => $a['pdv_id'],
                    'operator_id' => $a['operator_id'],
                ],
                ['status' => (bool) $a['status']]
            );
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Asignaciones guardadas correctamente.');
        }

        return redirect()->route('dcs.pdv-operators.index')->with('success', 'Asignaciones guardadas correctamente.');
    }

    /**
     * Export PDVs with operator columns to Excel.
     */
    public function export(Request $request)
    {
        if (!Auth::user()?->can('gestor-pdv-operadores-exportar')) {
            abort(403, 'No tienes permisos para exportar.');
        }

        $filters = [
            'search' => $request->get('search'),
            'business_id' => $request->get('business_id'),
            'zonal_id' => $request->get('zonal_id'),
            'circuit_id' => $request->get('circuit_id'),
            'route_id' => $request->get('route_id'),
        ];

        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);
        $filename = 'pdvs_operadores_' . now()->format('Y-m-d_H-i-s') . '.xlsx';

        return Excel::download(new PdvsOperatorsExport($filters, $operators), $filename);
    }

    /**
     * JSON data for map: all PDVs matching filters with lat/lng and operators (for PDV-Operadores map modal).
     */
    public function mapData(Request $request)
    {
        if (!Auth::user()?->can('gestor-pdv-operadores-ver-mapa')) {
            abort(403, 'No tienes permisos para ver el mapa.');
        }

        $searchFilter = $request->get('search');
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');
        $routeFilter = $request->get('route_id');
        $statusFilter = $request->get('status');
        $classificationFilter = $request->get('classification');

        $query = Pdv::with([
            'route.circuit.zonal.business',
            'operators' => fn ($q) => $q->withPivot('status'),
        ])
            ->select('id', 'point_name', 'client_name', 'latitude', 'longitude', 'route_id')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                    ->orWhere('client_name', 'like', "%{$searchFilter}%")
                    ->orWhere('document_number', 'like', "%{$searchFilter}%")
                    ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                    ->orWhereHas('route', fn ($r) => $r->where('name', 'like', "%{$searchFilter}%")->orWhere('code', 'like', "%{$searchFilter}%"));
            });
        }
        if ($businessFilter) {
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
        if ($statusFilter) {
            $query->byStatus($statusFilter);
        }
        if ($classificationFilter) {
            $query->byClassification($classificationFilter);
        }

        $pdvs = $query->orderBy('point_name')->get();
        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return response()->json([
            'pdvs' => $pdvs,
            'operators' => $operators,
        ]);
    }
}
