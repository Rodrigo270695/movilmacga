<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    // Los middleware de permisos están configurados en routes/admin.php

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!Auth::user()->can('gestor-roles-ver')) {
            abort(403, 'No tienes permisos para ver los roles.');
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $roles = Role::with('permissions')
            ->select('id', 'name', 'status', 'guard_name')
            ->paginate($perPage);

        $permissions = Permission::all();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleRequest $request)
    {
        // Verificar permisos
        if (!Auth::user()->can('gestor-roles-crear')) {
            abort(403, 'No tienes permisos para crear roles.');
        }

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
            'status' => true,
        ]);

        return redirect()->route('admin.roles.index')
            ->with('success', "Rol '{$role->name}' creado exitosamente. Ahora puedes asignar permisos desde la tabla.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleRequest $request, Role $role)
    {
        // Si viene solo el nombre, verificar permiso de editar
        if ($request->has('name') && !$request->has('permissions')) {
            if (!Auth::user()->can('gestor-roles-editar')) {
                abort(403, 'No tienes permisos para editar roles.');
            }

            $role->update([
                'name' => $request->name,
            ]);

            return redirect()->route('admin.roles.index')
                ->with('success', "Nombre del rol actualizado a '{$role->name}' exitosamente.");
        }

        // Si vienen permisos, verificar permiso de asignar permisos
        if ($request->has('permissions')) {
            if (!Auth::user()->can('gestor-roles-asignar-permisos')) {
                abort(403, 'No tienes permisos para asignar permisos a roles.');
            }

            $role->syncPermissions($request->permissions ?? []);

            $permissionCount = count($request->permissions ?? []);
            return redirect()->route('admin.roles.index')
                ->with('success', "Permisos del rol '{$role->name}' actualizados. {$permissionCount} permisos asignados.");
        }

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rol actualizado exitosamente.');
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Role $role)
    {
        // Verificar permisos
        if (!Auth::user()->can('gestor-roles-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de roles.');
        }

        $newStatus = !($role->status ?? true);
        $role->update(['status' => $newStatus]);

        $statusText = $newStatus ? 'activado' : 'desactivado';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Rol {$statusText} exitosamente.");
        }

        return redirect()->route('admin.roles.index')
            ->with('success', "Rol {$statusText} exitosamente.");
    }
}
