<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProfileController extends Controller
{
    /**
     * Cambiar contraseña del usuario autenticado
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Validar los datos de entrada
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
                'new_password_confirmation' => 'required|string'
            ], [
                'current_password.required' => 'La contraseña actual es requerida',
                'new_password.required' => 'La nueva contraseña es requerida',
                'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres',
                'new_password.confirmed' => 'La confirmación de la nueva contraseña no coincide',
                'new_password_confirmation.required' => 'La confirmación de la nueva contraseña es requerida'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar que la contraseña actual sea correcta
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta'
                ], 400);
            }

            // Verificar que la nueva contraseña sea diferente a la actual
            if (Hash::check($request->new_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La nueva contraseña debe ser diferente a la actual'
                ], 400);
            }

            // Actualizar la contraseña
            DB::table('users')
                ->where('id', $user->id)
                ->update(['password' => Hash::make($request->new_password)]);

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error al cambiar contraseña: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Obtener estadísticas del usuario autenticado
     */
    public function getUserStats()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Obtener estadísticas de visitas
            $totalVisits = DB::table('pdv_visits')
                ->where('user_id', $user->id)
                ->where('visit_status', 'completed')
                ->count();

            // Obtener circuitos únicos visitados
            $uniqueCircuits = DB::table('pdv_visits as pv')
                ->join('pdvs as p', 'pv.pdv_id', '=', 'p.id')
                ->join('routes as r', 'p.route_id', '=', 'r.id')
                ->join('circuits as c', 'r.circuit_id', '=', 'c.id')
                ->where('pv.user_id', $user->id)
                ->where('pv.visit_status', 'completed')
                ->distinct()
                ->count('c.id');

            // Calcular días activo (desde la primera visita hasta hoy)
            $firstVisit = DB::table('pdv_visits')
                ->where('user_id', $user->id)
                ->where('visit_status', 'completed')
                ->min('check_in_at');

            $activeDays = 0;
            if ($firstVisit) {
                $firstVisitDate = Carbon::parse($firstVisit);
                $today = Carbon::now();
                $activeDays = $firstVisitDate->diffInDays($today) + 1; // +1 para incluir el día actual
            }

            // Obtener estadísticas adicionales
            $thisMonthVisits = DB::table('pdv_visits')
                ->where('user_id', $user->id)
                ->where('visit_status', 'completed')
                ->whereMonth('check_in_at', Carbon::now()->month)
                ->whereYear('check_in_at', Carbon::now()->year)
                ->count();

            $thisWeekVisits = DB::table('pdv_visits')
                ->where('user_id', $user->id)
                ->where('visit_status', 'completed')
                ->whereBetween('check_in_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            // Obtener PDVs únicos visitados
            $uniquePdvs = DB::table('pdv_visits')
                ->where('user_id', $user->id)
                ->where('visit_status', 'completed')
                ->distinct()
                ->count('pdv_id');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_visits' => $totalVisits,
                    'unique_circuits' => $uniqueCircuits,
                    'active_days' => round($activeDays),
                    'this_month_visits' => $thisMonthVisits,
                    'this_week_visits' => $thisWeekVisits,
                    'unique_pdvs' => $uniquePdvs,
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->first_name && $user->last_name
                            ? $user->first_name . ' ' . $user->last_name
                            : $user->name,
                        'username' => $user->username,
                        'dni' => $user->dni,
                        'phone_number' => $user->phone_number,
                        'email' => $user->email
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas del usuario: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Obtener información detallada del perfil del usuario
     */
    public function getProfileInfo()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->first_name && $user->last_name
                        ? $user->first_name . ' ' . $user->last_name
                        : $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'dni' => $user->dni,
                    'phone_number' => $user->phone_number,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener información del perfil: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Actualizar información del perfil del usuario
     */
    public function updateProfile(Request $request)
    {
        try {
            Log::info('🔍 ProfileController.updateProfile - Iniciando actualización de perfil');
            Log::info('📝 Datos recibidos:', $request->all());

            $user = Auth::user();

            if (!$user) {
                Log::error('❌ Usuario no autenticado en updateProfile');
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            Log::info('👤 Usuario autenticado:', ['id' => $user->id, 'email' => $user->email]);

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:25',
                'last_name' => 'required|string|max:25',
                'email' => 'nullable|email|unique:users,email,' . $user->id,
                'phone_number' => 'nullable|string|max:20',
            ], [
                'first_name.required' => 'El nombre es requerido',
                'first_name.max' => 'El nombre no puede tener más de 25 caracteres',
                'last_name.required' => 'El apellido es requerido',
                'last_name.max' => 'El apellido no puede tener más de 25 caracteres',
                'email.email' => 'El formato del correo electrónico no es válido',
                'email.unique' => 'El correo electrónico ya está en uso',
                'phone_number.max' => 'El número de teléfono no puede tener más de 20 caracteres',
            ]);

            if ($validator->fails()) {
                Log::error('❌ Validación fallida:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('✅ Validación exitosa, procediendo a actualizar');

            // Actualizar el perfil
            $updateData = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone_number' => $request->phone_number,
                'updated_at' => now(),
            ];

            // Solo actualizar email si se proporciona uno
            if ($request->email) {
                $updateData['email'] = $request->email;
            }

            Log::info('🔄 Datos a actualizar:', $updateData);

            $result = DB::table('users')
                ->where('id', $user->id)
                ->update($updateData);

            Log::info('✅ Resultado de la actualización:', ['affected_rows' => $result]);

            // Verificar que se actualizó correctamente
            $updatedUser = DB::table('users')->where('id', $user->id)->first();
            Log::info('👤 Usuario después de actualizar:', [
                'first_name' => $updatedUser->first_name,
                'last_name' => $updatedUser->last_name,
                'email' => $updatedUser->email,
                'phone_number' => $updatedUser->phone_number
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => [
                    'first_name' => $updatedUser->first_name,
                    'last_name' => $updatedUser->last_name,
                    'email' => $updatedUser->email,
                    'phone_number' => $updatedUser->phone_number
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al actualizar perfil: ' . $e->getMessage());
            Log::error('📋 Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }
}
