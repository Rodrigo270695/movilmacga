<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\RouteRequest;
use App\Models\Route;
use App\Models\Circuit;
use App\Models\Zonal;
use App\Traits\HasBusinessScope;
use App\Exports\RoutesExport;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class GlobalRouteController extends Controller
{
    use HasBusinessScope;
    /**
     * Display a global listing of routes with filters.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!auth()->user()->can('gestor-ruta-ver')) {
            abort(403, 'No tienes permisos para ver las rutas.');
        }

        $perPage = $request->get('per_page', 10);
        $searchFilter = $request->get('search');
        $businessFilter = $request->get('business_id');
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');

        $query = Route::with(['circuit.zonal.business']);

        // Aplicar filtros de scope automáticos (negocio y zonal) ANTES del conteo
        $query = $this->applyFullScope($query, 'circuit.zonal.business', 'circuit.zonal');

        // Agregar conteo de PDVs totales DESPUÉS del scope
        $query->withCount('pdvs');

        // Aplicar filtro de búsqueda
        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('name', 'like', "%{$searchFilter}%")
                  ->orWhere('code', 'like', "%{$searchFilter}%")
                  ->orWhere('status', 'like', "%{$searchFilter}%");
            });
        }

        // Aplicar filtros adicionales
        if ($businessFilter) {
            $query->whereHas('circuit.zonal', function ($q) use ($businessFilter) {
                $q->where('business_id', $businessFilter);
            });
        }

        if ($zonalFilter) {
            $query->byZonal($zonalFilter);
        }

        if ($circuitFilter) {
            $query->byCircuit($circuitFilter);
        }

        $routes = $query->orderBy('name')->paginate($perPage);

        // Agregar conteo de PDVs activos y fechas de esta semana a cada ruta
        $routes->getCollection()->transform(function ($route) {
            // Conteo de PDVs activos
            $route->active_pdvs_count = $route->pdvs()->where('status', 'vende')->count();

            // Fechas de visita de esta semana
            $route->thisWeekVisits = $route->visitDates()
                ->whereBetween('visit_date', [
                    now()->startOfWeek()->format('Y-m-d'),
                    now()->endOfWeek()->format('Y-m-d')
                ])
                ->where('is_active', true)
                ->orderBy('visit_date')
                ->get(['visit_date']);

            return $route;
        });

        // Cargar datos para los filtros (aplicando scope)
        $businesses = $this->getAvailableBusinesses()->toArray();
        $allZonales = $this->getAvailableZonals()->toArray(); // Todos los zonales disponibles para el formulario

        // Filtrar zonales por negocio seleccionado solo para la vista
        $zonales = $this->getAvailableZonals();
        if ($businessFilter) {
            $zonales = $zonales->where('business_id', $businessFilter);
        }
        $zonales = $zonales->toArray();

        // Cargar todos los circuitos disponibles (aplicando scope)
        $allCircuitsQuery = Circuit::active()->with('zonal.business')->orderBy('name');
        $allCircuitsQuery = $this->applyFullScope($allCircuitsQuery, 'zonal.business', 'zonal');
        $allCircuits = $allCircuitsQuery->get(['id', 'name', 'code', 'zonal_id']);

        // Filtrar circuitos por negocio seleccionado solo para la vista
        $circuits = $allCircuits;
        if ($businessFilter) {
            $circuits = $circuits->filter(function ($circuit) use ($businessFilter) {
                return $circuit->zonal && $circuit->zonal->business_id == $businessFilter;
            });
        }

        // Convertir a array para el frontend
        $allCircuits = $allCircuits->toArray();
        $circuits = $circuits->toArray();

        return Inertia::render('dcs/routes/global-index', [
            'routes' => $routes,
            'businesses' => $businesses,
            'zonales' => $zonales,
            'allZonales' => $allZonales,
            'allCircuits' => $allCircuits,
            'circuits' => $circuits,
            'businessScope' => $this->getBusinessScope(),
            'filters' => [
                'search' => $searchFilter,
                'business_id' => $businessFilter,
                'zonal_id' => $zonalFilter,
                'circuit_id' => $circuitFilter,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage (global).
     */
    public function store(RouteRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-crear')) {
            abort(403, 'No tienes permisos para crear rutas.');
        }

        $route = Route::create([
            'circuit_id' => $request->circuit_id,
            'name' => $request->name,
            'code' => $request->code,
            'status' => true,
        ]);

        return redirect()->route('dcs.routes.index')
            ->with('success', "Ruta '{$route->name}' creada exitosamente.");
    }

    /**
     * Update the specified resource in storage (global).
     */
    public function update(RouteRequest $request, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-editar')) {
            abort(403, 'No tienes permisos para editar rutas.');
        }

        $route->update([
            'circuit_id' => $request->circuit_id,
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return redirect()->route('dcs.routes.index')
            ->with('success', "Ruta '{$route->name}' actualizada exitosamente.");
    }

    /**
     * Toggle the status of the specified resource (global).
     */
    public function toggleStatus(Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de rutas.');
        }

        // Determinar nuevo status
        $newStatus = $route->status ? 0 : 1;

        // Hacer el update
        $route->status = $newStatus;
        $route->save();

        $statusText = $newStatus ? 'activada' : 'desactivada';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Ruta {$statusText} exitosamente.");
        }

        return redirect()->route('dcs.routes.index')
            ->with('success', "Ruta {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage (global).
     */
    public function destroy(Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-eliminar')) {
            abort(403, 'No tienes permisos para eliminar rutas.');
        }

        $routeName = $route->name;
        $route->delete();

        return redirect()->route('dcs.routes.index')
            ->with('success', "Ruta '{$routeName}' eliminada exitosamente.");
    }

    /**
     * Export routes to Excel with applied filters.
     */
    public function export(Request $request)
    {
        try {
            // Verificar permisos
            if (!auth()->user()->can('gestor-ruta-ver')) {
                abort(403, 'No tienes permisos para exportar rutas.');
            }

            // Recopilar todos los filtros aplicados
            $filters = [
                'search' => $request->get('search'),
                'business_id' => $request->get('business_id'),
                'zonal_id' => $request->get('zonal_id'),
                'circuit_id' => $request->get('circuit_id'),
            ];

            // Generar nombre del archivo con timestamp
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "rutas_export_{$timestamp}.xlsx";

            // Log para debug
            Log::info('Iniciando exportación de rutas', ['filters' => $filters]);

            return Excel::download(new RoutesExport($filters), $filename);

        } catch (\Exception $e) {
            Log::error('Error en exportación de rutas', [
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
            return redirect()->route('dcs.routes.index')
                ->with('error', 'Error al exportar: ' . $e->getMessage());
        }
    }
}
