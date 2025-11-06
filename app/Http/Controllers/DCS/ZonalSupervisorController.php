<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\ZonalSupervisorRequest;
use App\Models\ZonalSupervisor;
use App\Models\Zonal;
use App\Models\User;
use App\Traits\HasBusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZonalSupervisorController extends Controller
{
    use HasBusinessScope;

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



        // Query para obtener los zonales con sus supervisores activos (hasta 5)
        $zonalsQuery = Zonal::with([
            'business',
            'activeZonalSupervisors.supervisor' => function ($query) {
                $query->select('id', 'first_name', 'last_name', 'email', 'status');
            }
        ]);

        // Aplicar filtros de scope (negocio + zonal)
        $zonalsQuery = $this->applyZonalBusinessScope($zonalsQuery);

        // Aplicar filtros a zonales
        if ($search) {
            $zonalsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('activeZonalSupervisors.supervisor', function ($subQuery) use ($search) {
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
            $zonalsQuery->whereHas('activeZonalSupervisors');
        } elseif ($status === 'unassigned') {
            $zonalsQuery->whereDoesntHave('activeZonalSupervisors');
        }

        // Obtener resultados paginados
        $zonals = $zonalsQuery->where('status', true)->paginate($perPage);

        // Obtener todos los supervisores activos (permitir asignación a múltiples zonales)
        $supervisors = User::role('Supervisor')
            ->where('status', true)
            ->get(['id', 'first_name', 'last_name', 'email', 'status']);

        // Obtener información de asignaciones existentes por supervisor
        $supervisorAssignments = [];
        foreach ($supervisors as $supervisor) {
            $activeAssignments = $supervisor->activeZonalSupervisorAssignments()
                ->with('zonal:id,name')
                ->get();

            if ($activeAssignments->count() > 0) {
                $supervisorAssignments[$supervisor->id] = [
                    'count' => $activeAssignments->count(),
                    'zonals' => $activeAssignments->pluck('zonal.name')->toArray()
                ];
            }
        }

        // Obtener negocios disponibles para el filtro (según scope del usuario)
        $businesses = $this->getAvailableBusinesses();

        return Inertia::render('dcs/zonal-supervisors/index', [
            'zonals' => $zonals,
            'supervisors' => $supervisors,
            'supervisorAssignments' => $supervisorAssignments,
            'businesses' => $businesses,
            'businessScope' => $this->getBusinessScope(),
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
            // Validar que el zonal no tenga ya 5 supervisores activos
            $currentSupervisorsCount = ZonalSupervisor::where('zonal_id', $request->zonal_id)
                ->where('is_active', true)
                ->count();

            if ($currentSupervisorsCount >= 5) {
                return back()->with('error', 'Este zonal ya tiene el máximo de 5 supervisores asignados. Desasigna uno antes de agregar otro.');
            }

            // Validar que el supervisor no esté ya asignado a este zonal
            $existingAssignment = ZonalSupervisor::where('zonal_id', $request->zonal_id)
                ->where('user_id', $request->user_id)
                ->where('is_active', true)
                ->first();

            if ($existingAssignment) {
                return back()->with('error', 'Este supervisor ya está asignado a este zonal.');
            }

            // Obtener información del supervisor y zonal antes de crear
            $supervisor = User::findOrFail($request->user_id);
            $zonal = Zonal::findOrFail($request->zonal_id);

            // Crear nueva asignación (sin desactivar las anteriores)
            $zonalSupervisor = ZonalSupervisor::create([
                'zonal_id' => $request->zonal_id,
                'user_id' => $request->user_id,
                'assigned_at' => now(),
                'is_active' => true,
                'notes' => $request->notes,
                'assignment_data' => $request->assignment_data,
            ]);

            // Verificar que realmente se creó
            if (!$zonalSupervisor || !$zonalSupervisor->id) {
                throw new \Exception('No se pudo crear la asignación en la base de datos.');
            }

            \Log::info('Supervisor asignado exitosamente', [
                'assignment_id' => $zonalSupervisor->id,
                'zonal_id' => $request->zonal_id,
                'user_id' => $request->user_id,
                'total_supervisors' => $currentSupervisorsCount + 1
            ]);

            $supervisorName = $supervisor->first_name . ' ' . $supervisor->last_name;
            $zonalName = $zonal->name;

            return back()->with('success', "Supervisor {$supervisorName} asignado al zonal {$zonalName} exitosamente.");
        } catch (\Exception $e) {
            \Log::error('Error al asignar supervisor', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
            // Si se cambia el zonal, validar que el nuevo zonal no tenga ya 5 supervisores
            if ($request->zonal_id != $zonalSupervisor->zonal_id) {
                $currentSupervisorsCount = ZonalSupervisor::where('zonal_id', $request->zonal_id)
                    ->where('is_active', true)
                    ->where('id', '!=', $zonalSupervisor->id)
                    ->count();

                if ($currentSupervisorsCount >= 5) {
                    return back()->with('error', 'El zonal destino ya tiene el máximo de 5 supervisores asignados.');
                }
            }

            // Validar que no exista ya este supervisor en el zonal destino
            $existingAssignment = ZonalSupervisor::where('zonal_id', $request->zonal_id)
                ->where('user_id', $request->user_id)
                ->where('is_active', true)
                ->where('id', '!=', $zonalSupervisor->id)
                ->first();

            if ($existingAssignment) {
                return back()->with('error', 'Este supervisor ya está asignado al zonal destino.');
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
