<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\VendorCircuitRequest;
use App\Models\UserCircuit;
use App\Models\Circuit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VendorCircuitController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Validar permisos
        if (!$request->user() || !$request->user()->can('gestor-vendedor-circuito-ver')) {
            abort(403, 'No tienes permisos para ver las asignaciones de vendedores a circuitos.');
        }

        // Obtener parámetros de filtrado y paginación
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $business = $request->get('business', '');
        $zonal = $request->get('zonal', '');
        $status = $request->get('status', '');

        // Query para obtener los circuitos con sus vendedores activos
        $circuitsQuery = Circuit::with([
            'zonal.business',
            'activeUserCircuits.user' => function ($query) {
                $query->select('id', 'first_name', 'last_name', 'email', 'status');
            }
        ]);

        // Aplicar filtros de scope según el usuario
        $businessScope = app('business.scope');

        // Log para debug
        Log::info('VendorCircuitController - Business Scope:', [
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'business_scope' => $businessScope
        ]);

        // Si el usuario tiene restricciones de negocio
        if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
            $circuitsQuery->whereHas('zonal.business', function ($query) use ($businessScope) {
                $query->whereIn('businesses.id', $businessScope['business_ids']);
            });
        }

        // Si el usuario tiene restricciones de zonal
        if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
            $circuitsQuery->whereIn('zonal_id', $businessScope['zonal_ids']);
        }

        // Aplicar filtros a circuitos
        if ($search) {
            $circuitsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('activeUserCircuits.user', function ($subQuery) use ($search) {
                      $subQuery->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($business) {
            $circuitsQuery->whereHas('zonal.business', function ($subQuery) use ($business) {
                $subQuery->where('name', $business);
            });
        }

        if ($zonal) {
            $circuitsQuery->whereHas('zonal', function ($subQuery) use ($zonal) {
                $subQuery->where('name', $zonal);
            });
        }

        if ($status === 'assigned') {
            $circuitsQuery->whereHas('activeUserCircuits');
        } elseif ($status === 'unassigned') {
            $circuitsQuery->whereDoesntHave('activeUserCircuits');
        }

        // Obtener resultados paginados
        $circuits = $circuitsQuery->where('status', true)->paginate($perPage);

        // Obtener vendedores filtrados según el scope del usuario
        $vendorsQuery = User::role('Vendedor')->where('status', true);

        // Si el usuario tiene restricciones de negocio, filtrar vendedores por circuitos asignados
        if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
            $vendorsQuery->whereHas('activeUserCircuits.circuit.zonal.business', function ($query) use ($businessScope) {
                $query->whereIn('businesses.id', $businessScope['business_ids']);
            });
        }

        // Si el usuario tiene restricciones de zonal, filtrar vendedores por zonales asignados
        if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
            $vendorsQuery->whereHas('activeUserCircuits.circuit', function ($query) use ($businessScope) {
                $query->whereIn('zonal_id', $businessScope['zonal_ids']);
            });
        }

        $vendors = $vendorsQuery->get(['id', 'first_name', 'last_name', 'email', 'status']);

        // Obtener negocios filtrados según el scope del usuario
        $businessesQuery = \App\Models\Business::where('status', true);
        if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
            $businessesQuery->whereIn('id', $businessScope['business_ids']);
        }
        $businesses = $businessesQuery->get(['id', 'name']);

        // Obtener zonales filtrados según el scope del usuario
        $zonalsQuery = \App\Models\Zonal::where('status', true)->with('business');
        if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
            $zonalsQuery->whereIn('id', $businessScope['zonal_ids']);
        } elseif ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
            // Si no tiene restricción de zonal pero sí de negocio, filtrar por negocio
            $zonalsQuery->whereHas('business', function ($query) use ($businessScope) {
                $query->whereIn('businesses.id', $businessScope['business_ids']);
            });
        }
        $zonals = $zonalsQuery->get(['id', 'name', 'business_id']);

        return Inertia::render('dcs/vendor-circuits/index', [
            'circuits' => $circuits,
            'vendors' => $vendors,
            'businesses' => $businesses,
            'zonals' => $zonals,
            'filters' => [
                'search' => $search,
                'business' => $business,
                'zonal' => $zonal,
                'status' => $status,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(VendorCircuitRequest $request): RedirectResponse
    {
        // Validar permisos
        if (!$request->user() || !$request->user()->can('gestor-vendedor-circuito-asignar')) {
            return back()->with('error', 'No tienes permisos para asignar vendedores a circuitos.');
        }

        try {
            // Crear nueva asignación (múltiples vendedores pueden estar asignados al mismo circuito)
            $userCircuit = UserCircuit::create([
                'circuit_id' => $request->circuit_id,
                'user_id' => $request->user_id,
                'assigned_date' => now(),
                'is_active' => true,
                'priority' => $request->priority ?? 1,
                'notes' => $request->notes,
                'assignment_data' => $request->assignment_data,
                'valid_from' => now(),
            ]);

            return back()->with('success', 'Vendedor asignado al circuito exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al asignar vendedor: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(VendorCircuitRequest $request, UserCircuit $userCircuit): RedirectResponse
    {
        // Validar permisos
        if (!$request->user() || !$request->user()->can('gestor-vendedor-circuito-asignar')) {
            return back()->with('error', 'No tienes permisos para reasignar vendedores.');
        }

        try {
            // Actualizar asignación (permitir múltiples vendedores por circuito)
            $userCircuit->update([
                'circuit_id' => $request->circuit_id,
                'user_id' => $request->user_id,
                'priority' => $request->priority ?? 1,
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
    public function destroy(Request $request, UserCircuit $userCircuit): RedirectResponse
    {
        // Validar permisos
        if (!$request->user() || !$request->user()->can('gestor-vendedor-circuito-desasignar')) {
            return back()->with('error', 'No tienes permisos para desasignar vendedores.');
        }

        try {
            // Eliminar la asignación directamente
            $userCircuit->delete();

            return back()->with('success', 'Vendedor desasignado del circuito exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al desasignar vendedor: ' . $e->getMessage());
        }
    }
}
