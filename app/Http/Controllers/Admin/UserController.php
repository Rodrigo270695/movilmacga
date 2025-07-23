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
        if (!auth()->user()->can('gestor-usuarios-ver')) {
            abort(403, 'No tienes permisos para ver los usuarios.');
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $users = User::with('roles')
            ->select('id', 'name', 'first_name', 'last_name', 'username', 'email', 'dni', 'phone_number', 'status', 'created_at')
            ->paginate($perPage);

        $roles = Role::where('status', true)->get();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-usuarios-crear')) {
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
        if (!auth()->user()->can('gestor-usuarios-editar')) {
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
        if (!auth()->user()->can('gestor-usuarios-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de usuarios.');
        }

        // Prevenir desactivar el propio usuario
        if ($user->id === auth()->user()->id) {
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
