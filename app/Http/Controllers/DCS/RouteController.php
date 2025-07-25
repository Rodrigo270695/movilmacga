<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\RouteRequest;
use App\Models\Route;
use App\Models\Circuit;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RouteController extends Controller
{
    /**
     * Display a listing of the resource for a specific circuit within a zonal.
     */
    public function index(Request $request, Zonal $zonal, Circuit $circuit)
    {
        // Verificar permisos específicos
        if (!auth()->user()->can('gestor-ruta-ver')) {
            abort(403, 'No tienes permisos para ver las rutas.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado en este zonal.');
        }

        $perPage = $request->get('per_page', 10);

        $routes = Route::with(['circuit.zonal'])
            ->where('circuit_id', $circuit->id)
            ->select('id', 'circuit_id', 'name', 'code', 'status', 'created_at')
            ->orderBy('name')
            ->paginate($perPage);

        return Inertia::render('dcs/routes/index', [
            'routes' => $routes,
            'circuit' => $circuit->load('zonal'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RouteRequest $request, Zonal $zonal, Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-crear')) {
            abort(403, 'No tienes permisos para crear rutas.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado en este zonal.');
        }

        $route = Route::create([
            'circuit_id' => $circuit->id,
            'name' => $request->name,
            'code' => $request->code,
            'status' => true,
        ]);

        return redirect()->route('dcs.zonales.circuits.routes.index', [$zonal, $circuit])
            ->with('success', "Ruta '{$route->name}' creada exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RouteRequest $request, Zonal $zonal, Circuit $circuit, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-editar')) {
            abort(403, 'No tienes permisos para editar rutas.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado en este zonal.');
        }

        // Verificar que la ruta pertenece al circuito
        if ($route->circuit_id !== $circuit->id) {
            abort(404, 'Ruta no encontrada.');
        }

        $route->update([
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return redirect()->route('dcs.zonales.circuits.routes.index', [$zonal, $circuit])
            ->with('success', "Ruta '{$route->name}' actualizada exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Zonal $zonal, Circuit $circuit, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de rutas.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado en este zonal.');
        }

        // Verificar que la ruta pertenece al circuito
        if ($route->circuit_id !== $circuit->id) {
            abort(404, 'Ruta no encontrada.');
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

        return redirect()->route('dcs.zonales.circuits.routes.index', [$zonal, $circuit])
            ->with('success', "Ruta {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Zonal $zonal, Circuit $circuit, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-ruta-eliminar')) {
            abort(403, 'No tienes permisos para eliminar rutas.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado en este zonal.');
        }

        // Verificar que la ruta pertenece al circuito
        if ($route->circuit_id !== $circuit->id) {
            abort(404, 'Ruta no encontrada.');
        }

        $routeName = $route->name;
        $route->delete();

        return redirect()->route('dcs.zonales.circuits.routes.index', [$zonal, $circuit])
            ->with('success', "Ruta '{$routeName}' eliminada exitosamente.");
    }
}
