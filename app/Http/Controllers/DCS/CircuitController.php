<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\CircuitRequest;
use App\Models\Circuit;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CircuitController extends Controller
{
    /**
     * Display a listing of the resource for a specific zonal.
     */
    public function index(Request $request, Zonal $zonal)
    {
        // Verificar permisos específicos
        if (!auth()->user()->can('gestor-circuito-ver')) {
            abort(403, 'No tienes permisos para ver los circuitos.');
        }

        $perPage = $request->get('per_page', 10);

        $circuits = Circuit::with('zonal')
            ->withCount('routes')
            ->where('zonal_id', $zonal->id)
            ->orderBy('name')
            ->paginate($perPage);

        return Inertia::render('dcs/circuits/index', [
            'circuits' => $circuits,
            'zonal' => $zonal,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CircuitRequest $request, Zonal $zonal)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-crear')) {
            abort(403, 'No tienes permisos para crear circuitos.');
        }

        $circuit = Circuit::create([
            'zonal_id' => $zonal->id,
            'name' => $request->name,
            'code' => $request->code,
            'status' => true,
        ]);

        return redirect()->route('dcs.zonales.circuits.index', $zonal)
            ->with('success', "Circuito '{$circuit->name}' creado exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CircuitRequest $request, Zonal $zonal, Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-editar')) {
            abort(403, 'No tienes permisos para editar circuitos.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado.');
        }

        $circuit->update([
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return redirect()->route('dcs.zonales.circuits.index', $zonal)
            ->with('success', "Circuito '{$circuit->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Zonal $zonal, Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de circuitos.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado.');
        }

        // Determinar nuevo status
        $newStatus = $circuit->status ? 0 : 1;

        // Hacer el update
        $circuit->status = $newStatus;
        $circuit->save();

        $statusText = $newStatus ? 'activado' : 'desactivado';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Circuito {$statusText} exitosamente.");
        }

        return redirect()->route('dcs.zonales.circuits.index', $zonal)
            ->with('success', "Circuito {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Zonal $zonal, Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-eliminar')) {
            abort(403, 'No tienes permisos para eliminar circuitos.');
        }

        // Verificar que el circuito pertenece al zonal
        if ($circuit->zonal_id !== $zonal->id) {
            abort(404, 'Circuito no encontrado.');
        }

        $circuitName = $circuit->name;
        $circuit->delete();

        return redirect()->route('dcs.zonales.circuits.index', $zonal)
            ->with('success', "Circuito '{$circuitName}' eliminado exitosamente.");
    }
}
