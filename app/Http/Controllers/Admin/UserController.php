<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Los middleware de permisos están configurados en routes/admin.php

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!request()->user()->can('gestor-usuarios-ver')) {
            abort(403, 'No tienes permisos para ver los usuarios.');
        }

        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $roleFilter = $request->get('role', '');
        $statusFilter = $request->get('status', '');

        // Query base
        $usersQuery = User::with('roles')
            ->select('id', 'name', 'first_name', 'last_name', 'username', 'email', 'dni', 'phone_number', 'status', 'created_at');

        // Filtro automático por rol del usuario logueado
        $currentUser = request()->user();
        if ($currentUser->hasRole('Supervisor')) {
            // Los supervisores solo pueden ver vendedores
            $usersQuery->whereHas('roles', function ($query) {
                $query->where('name', 'Vendedor');
            });
        }

        // Aplicar filtro de búsqueda
        if ($search) {
            $usersQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('dni', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%")
                      ->orWhereHas('roles', function ($roleQuery) use ($search) {
                          $roleQuery->where('name', 'like', "%{$search}%");
                      });
            });
        }

        // Aplicar filtro por rol
        if ($roleFilter) {
            $usersQuery->whereHas('roles', function ($query) use ($roleFilter) {
                $query->where('name', $roleFilter);
            });
        }

        // Aplicar filtro por estado
        if ($statusFilter !== '') {
            if ($statusFilter === 'active') {
                $usersQuery->where('status', true);
            } elseif ($statusFilter === 'inactive') {
                $usersQuery->where('status', false);
            }
        }

        $users = $usersQuery->paginate($perPage);

        $roles = Role::where('status', true)->get();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Verificar permisos
        if (!request()->user()->can('gestor-usuarios-crear')) {
            abort(403, 'No tienes permisos para crear usuarios.');
        }

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'username' => $request->username,
            'email' => $request->email,
            'dni' => $request->dni,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password ?? 'password123'),
            'status' => true,
        ]);

        // Asignar roles si se proporcionan
        if ($request->has('roles')) {
            $user->syncRoles($request->roles ?? []);
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Usuario '{$user->name}' creado exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        // Verificar permisos de editar
        if (!request()->user()->can('gestor-usuarios-editar')) {
            abort(403, 'No tienes permisos para editar usuarios.');
        }

        // Actualizar datos del usuario
        $user->update([
            'name' => $request->first_name . ' ' . $request->last_name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'username' => $request->username,
            'email' => $request->email,
            'dni' => $request->dni,
            'phone_number' => $request->phone_number,
        ]);

        // Actualizar contraseña solo si se proporciona
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        // Sincronizar roles si se proporcionan
        if ($request->has('roles')) {
            $user->syncRoles($request->roles ?? []);
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Usuario '{$user->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(User $user)
    {
        // Verificar permisos
        if (!request()->user()->can('gestor-usuarios-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de usuarios.');
        }

        // Prevenir desactivar el propio usuario
        if ($user->id === request()->user()->id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'No puedes desactivar tu propia cuenta.');
        }

        // Determinar nuevo status de forma simple
        $newStatus = $user->status ? 0 : 1; // Si es 1 lo ponemos en 0, si es 0 lo ponemos en 1

        // Hacer el update
        $user->status = $newStatus;
        $user->save();

        $statusText = $newStatus ? 'activado' : 'desactivado';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Usuario {$statusText} exitosamente.");
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Usuario {$statusText} exitosamente.");
    }
}
