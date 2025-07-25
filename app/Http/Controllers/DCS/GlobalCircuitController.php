<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\CircuitRequest;
use App\Models\Circuit;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;

class GlobalCircuitController extends Controller
{
    /**
     * Display a global listing of circuits with filters.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!auth()->user()->can('gestor-circuito-ver')) {
            abort(403, 'No tienes permisos para ver los circuitos.');
        }

        $perPage = $request->get('per_page', 10);
        $zonalFilter = $request->get('zonal_id');
        $search = $request->get('search');

        $query = Circuit::with(['zonal'])
            ->withCount('routes');

        // Aplicar filtros
        if ($zonalFilter) {
            $query->byZonal($zonalFilter);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('zonal', function ($zonalQuery) use ($search) {
                      $zonalQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $circuits = $query->orderBy('name')->paginate($perPage);

        // Cargar datos para los filtros
        $zonales = Zonal::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('dcs/circuits/global-index', [
            'circuits' => $circuits,
            'zonales' => $zonales,
            'filters' => [
                'search' => $search,
                'zonal_id' => $zonalFilter,
            ]
        ]);
    }

    /**
     * Store a newly created circuit in storage (global context).
     */
    public function store(CircuitRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-crear')) {
            abort(403, 'No tienes permisos para crear circuitos.');
        }

        $circuit = Circuit::create([
            'zonal_id' => $request->zonal_id,
            'name' => $request->name,
            'code' => $request->code,
            'status' => true,
        ]);

        return redirect()->route('dcs.circuits.index')
            ->with('success', "Circuito '{$circuit->name}' creado exitosamente.");
    }

    /**
     * Update the specified circuit in storage (global context).
     */
    public function update(CircuitRequest $request, Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-editar')) {
            abort(403, 'No tienes permisos para editar circuitos.');
        }

        $circuit->update([
            'zonal_id' => $request->zonal_id,
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return redirect()->route('dcs.circuits.index')
            ->with('success', "Circuito '{$circuit->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified circuit (global context).
     */
    public function toggleStatus(Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de circuitos.');
        }

        $circuit->update([
            'status' => !$circuit->status
        ]);

        $statusText = $circuit->status ? 'activado' : 'desactivado';

        return redirect()->route('dcs.circuits.index')
            ->with('success', "Circuito '{$circuit->name}' {$statusText} exitosamente.");
    }

    /**
     * Remove the specified circuit from storage (global context).
     */
    public function destroy(Circuit $circuit)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-circuito-eliminar')) {
            abort(403, 'No tienes permisos para eliminar circuitos.');
        }

        // Verificar si tiene rutas asociadas
        if ($circuit->routes()->count() > 0) {
            return redirect()->route('dcs.circuits.index')
                ->with('error', "No se puede eliminar el circuito '{$circuit->name}' porque tiene rutas asociadas.");
        }

        $circuitName = $circuit->name;
        $circuit->delete();

        return redirect()->route('dcs.circuits.index')
            ->with('success', "Circuito '{$circuitName}' eliminado exitosamente.");
    }
}
