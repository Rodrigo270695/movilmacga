<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\ZonalSupervisorRequest;
use App\Models\ZonalSupervisor;
use App\Models\Zonal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZonalSupervisorController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-zonal-supervisor-ver')) {
            abort(403, 'No tienes permisos para ver las asignaciones de supervisores a zonales.');
        }

        // Obtener parámetros de filtrado y paginación
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $business = $request->get('business', '');
        $status = $request->get('status', '');



        // Query para obtener los zonales con sus supervisores activos
        $zonalsQuery = Zonal::with([
            'business',
            'activeZonalSupervisor.supervisor' => function ($query) {
                $query->select('id', 'first_name', 'last_name', 'email', 'status');
            }
        ]);

        // Aplicar filtros a zonales
        if ($search) {
            $zonalsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('activeZonalSupervisor.supervisor', function ($subQuery) use ($search) {
                      $subQuery->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($business) {
            $zonalsQuery->whereHas('business', function ($subQuery) use ($business) {
                $subQuery->where('name', $business);
            });
        }

        if ($status === 'assigned') {
            $zonalsQuery->whereHas('activeZonalSupervisor');
        } elseif ($status === 'unassigned') {
            $zonalsQuery->whereDoesntHave('activeZonalSupervisor');
        }

        // Obtener resultados paginados
        $zonals = $zonalsQuery->where('status', true)->paginate($perPage);

        // Obtener supervisores disponibles (sin asignación activa)
        $supervisors = User::role('Supervisor')
            ->where('status', true)
            ->whereDoesntHave('activeZonalSupervisorAssignments')
            ->get(['id', 'first_name', 'last_name', 'email', 'status']);

        // Obtener todos los negocios para el filtro
        $businesses = \App\Models\Business::where('status', true)->get(['id', 'name']);

        return Inertia::render('dcs/zonal-supervisors/index', [
            'zonals' => $zonals,
            'supervisors' => $supervisors,
            'businesses' => $businesses,
            'filters' => [
                'search' => $search,
                'business' => $business,
                'status' => $status,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ZonalSupervisorRequest $request): RedirectResponse
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-zonal-supervisor-asignar')) {
            return back()->with('error', 'No tienes permisos para asignar supervisores a zonales.');
        }

        try {
            // Desactivar asignación anterior del zonal si existe
            ZonalSupervisor::where('zonal_id', $request->zonal_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            // Crear nueva asignación
            $zonalSupervisor = ZonalSupervisor::create([
                'zonal_id' => $request->zonal_id,
                'user_id' => $request->user_id,
                'assigned_at' => now(),
                'is_active' => true,
                'notes' => $request->notes,
                'assignment_data' => $request->assignment_data,
            ]);

            return back()->with('success', 'Supervisor asignado al zonal exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al asignar supervisor: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ZonalSupervisorRequest $request, ZonalSupervisor $zonalSupervisor): RedirectResponse
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-zonal-supervisor-asignar')) {
            return back()->with('error', 'No tienes permisos para reasignar supervisores.');
        }

        try {
            // Si se cambia el supervisor, desactivar asignación anterior del zonal
            if ($request->zonal_id != $zonalSupervisor->zonal_id) {
                ZonalSupervisor::where('zonal_id', $request->zonal_id)
                    ->where('is_active', true)
                    ->where('id', '!=', $zonalSupervisor->id)
                    ->update(['is_active' => false]);
            }

            // Actualizar asignación
            $zonalSupervisor->update([
                'zonal_id' => $request->zonal_id,
                'user_id' => $request->user_id,
                'notes' => $request->notes,
                'assignment_data' => $request->assignment_data,
            ]);

            return back()->with('success', 'Asignación actualizada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al actualizar asignación: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage (desasignar).
     */
    public function destroy(ZonalSupervisor $zonalSupervisor): RedirectResponse
    {

        // Validar permisos
        if (!auth()->user()->can('gestor-zonal-supervisor-desasignar')) {
            return back()->with('error', 'No tienes permisos para desasignar supervisores.');
        }

                try {
            // Eliminar la asignación directamente
            $zonalSupervisor->delete();

            return back()->with('success', 'Supervisor desasignado del zonal exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al desasignar supervisor: ' . $e->getMessage());
        }
    }
}
