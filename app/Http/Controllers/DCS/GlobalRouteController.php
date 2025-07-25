<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\RouteRequest;
use App\Models\Route;
use App\Models\Circuit;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;

class GlobalRouteController extends Controller
{
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
        $zonalFilter = $request->get('zonal_id');
        $circuitFilter = $request->get('circuit_id');

        $query = Route::with(['circuit.zonal'])
            ->select('id', 'circuit_id', 'name', 'code', 'status', 'created_at');

        // Aplicar filtros
        if ($zonalFilter) {
            $query->byZonal($zonalFilter);
        }

        if ($circuitFilter) {
            $query->byCircuit($circuitFilter);
        }

        $routes = $query->orderBy('name')->paginate($perPage);

        // Cargar datos para los filtros
        $zonales = Zonal::active()->orderBy('name')->get(['id', 'name']);
        $circuits = Circuit::active()->with('zonal')->orderBy('name')->get(['id', 'name', 'code', 'zonal_id']);

        return Inertia::render('dcs/routes/global-index', [
            'routes' => $routes,
            'zonales' => $zonales,
            'circuits' => $circuits,
            'filters' => [
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
}
