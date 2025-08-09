<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use App\Traits\HasBusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BusinessUserController extends Controller
{
    use HasBusinessScope;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-ver')) {
            abort(403, 'No tienes permisos para ver las asignaciones de usuarios a negocios.');
        }

        // Obtener parámetros de filtrado y paginación
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $business = $request->get('business', '');
        $status = $request->get('status', '');

        // Query para obtener los negocios con sus usuarios activos
        $businessesQuery = Business::with([
            'activeUsers' => function ($query) {
                $query->select('users.id', 'first_name', 'last_name', 'email', 'status');
            }
        ]);

        // Aplicar filtros de scope de negocio
        $businessesQuery = $this->applyBusinessScope($businessesQuery, 'id');

        // Aplicar filtros a negocios
        if ($search) {
            $businessesQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('activeUsers', function ($subQuery) use ($search) {
                      $subQuery->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($business) {
            $businessesQuery->where('name', $business);
        }

        if ($status === 'assigned') {
            $businessesQuery->whereHas('activeUsers');
        } elseif ($status === 'unassigned') {
            $businessesQuery->whereDoesntHave('activeUsers');
        }

        // Obtener resultados paginados
        $businesses = $businessesQuery->where('status', true)->paginate($perPage);

        // Obtener todos los usuarios activos (sin filtrar por asignaciones)
        $allActiveUsers = User::where('status', true)
            ->get(['id', 'first_name', 'last_name', 'email', 'status']);

        // Obtener negocios disponibles para el filtro (según scope del usuario)
        $allBusinesses = $this->getAvailableBusinesses();

        return Inertia::render('admin/business-users/index', [
            'businesses' => $businesses,
            'users' => $allActiveUsers,
            'allBusinesses' => $allBusinesses,
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
    public function store(Request $request): RedirectResponse
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-asignar')) {
            return back()->with('error', 'No tienes permisos para asignar usuarios a negocios.');
        }

        try {
            $request->validate([
                'business_id' => 'required|integer|exists:businesses,id',
                'user_id' => 'required|integer|exists:users,id',
                'notes' => 'nullable|string|max:500',
                'assignment_data' => 'nullable|array',
            ]);

            // Verificar si ya existe una asignación activa para este negocio específico
            $activeAssignment = DB::table('business_user')
                ->where('business_id', $request->business_id)
                ->where('user_id', $request->user_id)
                ->where('is_active', true)
                ->first();

            if ($activeAssignment) {
                return back()->with('error', 'El usuario ya está asignado a este negocio específico.');
            }

            // Verificar si existe una asignación inactiva para reactivar
            $inactiveAssignment = DB::table('business_user')
                ->where('business_id', $request->business_id)
                ->where('user_id', $request->user_id)
                ->where('is_active', false)
                ->first();

            if ($inactiveAssignment) {
                // Reactivar asignación existente
                $result = DB::table('business_user')
                    ->where('id', $inactiveAssignment->id)
                    ->update([
                        'is_active' => true,
                        'assigned_at' => now(),
                        'unassigned_at' => null,
                        'notes' => $request->notes,
                        'assignment_data' => $request->assignment_data ? json_encode($request->assignment_data) : null,
                        'updated_at' => now(),
                    ]);
            } else {
                // Crear nueva asignación
                $assignmentData = [
                    'business_id' => $request->business_id,
                    'user_id' => $request->user_id,
                    'is_active' => true,
                    'assigned_at' => now(),
                    'notes' => $request->notes,
                    'assignment_data' => $request->assignment_data ? json_encode($request->assignment_data) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $result = DB::table('business_user')->insert($assignmentData);
            }

            // Verificar que la operación fue exitosa
            if (!$result) {
                throw new \Exception('No se pudo procesar la asignación en la base de datos');
            }

            return back()->with('success', 'Usuario asignado al negocio exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al asignar usuario: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-asignar')) {
            return back()->with('error', 'No tienes permisos para reasignar usuarios.');
        }

        try {
            $request->validate([
                'business_id' => 'required|exists:businesses,id',
                'user_id' => 'required|exists:users,id',
                'notes' => 'nullable|string|max:500',
                'assignment_data' => 'nullable|array',
            ]);

            // Actualizar asignación
            DB::table('business_user')
                ->where('id', $id)
                ->update([
                    'business_id' => $request->business_id,
                    'user_id' => $request->user_id,
                    'notes' => $request->notes,
                    'assignment_data' => $request->assignment_data ? json_encode($request->assignment_data) : null,
                    'updated_at' => now(),
                ]);

            return back()->with('success', 'Asignación actualizada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al actualizar asignación: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage (desasignar).
     */
    public function destroy($id): RedirectResponse
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-desasignar')) {
            return back()->with('error', 'No tienes permisos para desasignar usuarios.');
        }

        try {
            // Desactivar la asignación
            DB::table('business_user')
                ->where('id', $id)
                ->update([
                    'is_active' => false,
                    'unassigned_at' => now(),
                    'updated_at' => now(),
                ]);

            return back()->with('success', 'Usuario desasignado del negocio exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al desasignar usuario: ' . $e->getMessage());
        }
    }

    /**
     * Show all users for a specific business.
     */
    public function showUsers(Business $business, Request $request): Response
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-ver')) {
            abort(403, 'No tienes permisos para ver los usuarios de este negocio.');
        }

        // Obtener parámetros de filtrado y paginación
        $perPage = $request->get('per_page', 25);
        $search = $request->get('search', '');

        // Query para obtener usuarios del negocio
        $usersQuery = $business->activeUsers();

        // Aplicar filtro de búsqueda
        if ($search) {
            $usersQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Obtener usuarios paginados
        $users = $usersQuery->paginate($perPage);

        return Inertia::render('admin/business-users/users', [
            'business' => $business,
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Unassign a specific user from a business.
     */
    public function unassignUser(Business $business, User $user): RedirectResponse
    {
        // Validar permisos
        if (!Auth::user()->can('gestor-business-user-desasignar')) {
            return back()->with('error', 'No tienes permisos para desasignar usuarios.');
        }

        try {
            // Buscar la asignación específica entre el negocio y el usuario
            $assignment = DB::table('business_user')
                ->where('business_id', $business->id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$assignment) {
                return back()->with('error', 'El usuario no está asignado a este negocio.');
            }

            // Desactivar la asignación (no eliminar, solo marcar como inactiva)
            DB::table('business_user')
                ->where('id', $assignment->id)
                ->update([
                    'is_active' => false,
                    'unassigned_at' => now(),
                    'updated_at' => now(),
                ]);

            return back()->with('success', "Usuario {$user->first_name} {$user->last_name} desasignado del negocio {$business->name} exitosamente.");
        } catch (\Exception $e) {
            return back()->with('error', 'Error al desasignar usuario: ' . $e->getMessage());
        }
    }
}
