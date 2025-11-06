<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login de vendedor via API
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'device_name' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Las credenciales son incorrectas.'],
            ]);
        }

        // Verificar que el usuario esté activo
        if (!$user->status) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está desactivada. Contacta al administrador.',
            ], 403);
        }

        // Verificar que tenga rol de Vendedor o Supervisor
        if (!$user->hasAnyRole(['Vendedor', 'Supervisor'])) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para usar la aplicación móvil.',
            ], 403);
        }

        // Revocar tokens existentes para este dispositivo
        $user->tokens()->where('name', $request->device_name)->delete();

        // Crear nuevo token
        $token = $user->createToken($request->device_name, [
            'gps:record',
            'visits:manage',
            'sessions:manage'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'dni' => $user->dni,
                    'phone_number' => $user->phone_number,
                    'roles' => $user->getRoleNames(),
                ],
                'token' => $token->plainTextToken,
                'expires_at' => now()->addDays(30)->toISOString(),
            ]
        ]);
    }

    /**
     * Logout del vendedor
     */
    public function logout(Request $request)
    {
        // Revocar el token actual
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout exitoso'
        ]);
    }

    /**
     * Obtener perfil del usuario autenticado
     */
    public function profile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                \Log::warning('API Profile: Usuario no autenticado', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'token_present' => $request->bearerToken() ? 'yes' : 'no'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'No autenticado',
                ], 401);
            }

            // Verificar que el usuario esté activo
            if (!$user->status) {
                \Log::warning('API Profile: Usuario desactivado intentando acceder', [
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'ip' => $request->ip()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Tu cuenta está desactivada. Contacta al administrador.',
                ], 403);
            }

            // Cargar circuitos asignados activos
            $user->load(['activeUserCircuits.circuit.zonal', 'activeZonalSupervisorAssignments.zonal']);

            \Log::info('API Profile: Perfil obtenido exitosamente', [
                'user_id' => $user->id,
                'username' => $user->username
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'username' => $user->username,
                        'dni' => $user->dni,
                        'phone_number' => $user->phone_number,
                        'email' => $user->email,
                        'roles' => $user->getRoleNames(),
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                    ],
                    'assignments' => [
                        'circuits' => $user->activeUserCircuits->map(function ($assignment) {
                            return [
                                'assignment_id' => $assignment->id,
                                'circuit_id' => $assignment->circuit->id,
                                'circuit_name' => $assignment->circuit->name,
                                'circuit_code' => $assignment->circuit->code,
                                'zonal_name' => $assignment->circuit->zonal->name,
                                'priority' => $assignment->priority,
                                'assigned_date' => $assignment->assigned_date,
                                'notes' => $assignment->notes,
                            ];
                        }),
                        'supervised_zonales' => $user->activeZonalSupervisorAssignments->map(function ($assignment) {
                            return [
                                'assignment_id' => $assignment->id,
                                'zonal_id' => $assignment->zonal->id,
                                'zonal_name' => $assignment->zonal->name,
                                'assigned_at' => $assignment->assigned_at,
                            ];
                        }),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('API Profile: Error al obtener perfil', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil',
            ], 500);
        }
    }

    /**
     * Refrescar token (renovar por otros 30 días)
     */
    public function refreshToken(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string',
        ]);

        $user = $request->user();

        // Revocar token actual
        $request->user()->currentAccessToken()->delete();

        // Crear nuevo token
        $token = $user->createToken($request->device_name, [
            'gps:record',
            'visits:manage',
            'sessions:manage'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Token renovado exitosamente',
            'data' => [
                'token' => $token->plainTextToken,
                'expires_at' => now()->addDays(30)->toISOString(),
            ]
        ]);
    }
}
