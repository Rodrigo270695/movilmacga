<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkingSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkingSessionController extends Controller
{
    /**
     * Iniciar jornada laboral
     */
    public function start(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        // Verificar que no tenga una sesión activa
        $activeSession = WorkingSession::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($activeSession) {
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes una jornada activa. Debes finalizarla primero.',
                'data' => [
                    'active_session_id' => $activeSession->id,
                    'started_at' => $activeSession->started_at,
                ]
            ], 400);
        }

        try {
            DB::beginTransaction();

            $session = WorkingSession::create([
                'user_id' => $user->id,
                'started_at' => now(),
                'start_latitude' => $request->latitude,
                'start_longitude' => $request->longitude,
                'status' => 'active',
                'notes' => $request->notes,
                'session_data' => [
                    'start_device_info' => [
                        'user_agent' => $request->userAgent(),
                        'ip' => $request->ip(),
                    ]
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jornada iniciada exitosamente',
                'data' => [
                    'session_id' => $session->id,
                    'started_at' => $session->started_at,
                    'status' => $session->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar jornada',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalizar jornada laboral
     */
    public function end(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        // 🔍 LOGGING DEBUG - Inicio
        \Log::info('🏁 END WORKING SESSION - Inicio', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'timestamp' => now()->toISOString()
        ]);

        $activeSession = WorkingSession::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        // 🔍 LOGGING DEBUG - Session encontrada
        \Log::info('🔍 Session encontrada', [
            'session_id' => $activeSession ? $activeSession->id : null,
            'status' => $activeSession ? $activeSession->status : null
        ]);

        if (!$activeSession) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una jornada activa para finalizar.',
            ], 400);
        }

                try {
            // 🧪 PRUEBA ULTRA-SIMPLE: SIN TRANSACCIÓN, SOLO UPDATE BÁSICO
            \Log::info('🧪 === PRUEBA ULTRA-SIMPLE ===');
            \Log::info('📊 Session a actualizar:', [
                'id' => $activeSession->id,
                'user_id' => $user->id,
                'status_actual' => $activeSession->status
            ]);

            // ⭐ UPDATE MÁS SIMPLE POSIBLE
            $updateResult = DB::update('
                UPDATE working_sessions
                SET status = ?, ended_at = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
            ', [
                'completed',
                now(),
                now(),
                $activeSession->id,
                $user->id
            ]);

            \Log::info('✅ UPDATE SIMPLE resultado:', ['rows_affected' => $updateResult]);

            // 🔍 VERIFICACIÓN INMEDIATA
            $verification = DB::select('SELECT id, status, ended_at FROM working_sessions WHERE id = ?', [
                $activeSession->id
            ]);
            \Log::info('🔍 VERIFICACIÓN POST-UPDATE:', ['db_result' => $verification]);

            if ($updateResult > 0) {
                \Log::info('✅ UPDATE EXITOSO - Devolviendo success');
                return response()->json([
                    'success' => true,
                    'message' => 'Jornada finalizada exitosamente',
                    'data' => [
                        'session_id' => $activeSession->id,
                        'status' => 'completed',
                    ]
                ]);
            } else {
                \Log::error('❌ UPDATE FALLÓ - 0 rows affected');
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo actualizar la jornada - 0 rows affected',
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('❌ EXCEPCIÓN en end():', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al finalizar jornada: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pausar jornada laboral
     */
    public function pause(Request $request)
    {
        $user = $request->user();

        $activeSession = WorkingSession::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (!$activeSession) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una jornada activa para pausar.',
            ], 400);
        }

        $activeSession->update(['status' => 'paused']);

        return response()->json([
            'success' => true,
            'message' => 'Jornada pausada',
            'data' => [
                'session_id' => $activeSession->id,
                'status' => 'paused',
            ]
        ]);
    }

    /**
     * Reanudar jornada laboral
     */
    public function resume(Request $request)
    {
        $user = $request->user();

        $pausedSession = WorkingSession::where('user_id', $user->id)
            ->where('status', 'paused')
            ->first();

        if (!$pausedSession) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una jornada pausada para reanudar.',
            ], 400);
        }

        $pausedSession->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'Jornada reanudada',
            'data' => [
                'session_id' => $pausedSession->id,
                'status' => 'active',
            ]
        ]);
    }

    /**
     * Obtener jornada actual
     */
    public function getCurrent(Request $request)
    {
        $user = $request->user();

        // 🔍 LOGGING DEBUG - Inicio getCurrent
        \Log::info('📊 GET CURRENT SESSION - Inicio', [
            'user_id' => $user->id,
            'timestamp' => now()->toISOString()
        ]);

        // 🔍 DEBUGGING DIRECTO EN BD
        $rawSessions = DB::select('SELECT id, status, started_at, ended_at FROM working_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 3', [
            $user->id
        ]);
        \Log::info('🔍 SESIONES RAW EN BD (últimas 3):', ['raw_sessions' => $rawSessions]);

        $currentSession = WorkingSession::where('user_id', $user->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        // 🔍 LOGGING DEBUG - Resultado de la búsqueda
        \Log::info('🔍 Búsqueda de session actual', [
            'user_id' => $user->id,
            'session_encontrada' => !!$currentSession,
            'session_id' => $currentSession ? $currentSession->id : null,
            'status' => $currentSession ? $currentSession->status : null
        ]);

        if (!$currentSession) {
            \Log::info('✅ No hay jornada activa - devolviendo null');
            return response()->json([
                'success' => true,
                'message' => 'No hay jornada activa',
                'data' => null
            ]);
        }

        // Calcular métricas en tiempo real
        $currentDuration = now()->diffInMinutes($currentSession->started_at);
        $todayPdvsVisited = $user->pdvVisits()
            ->whereDate('check_in_at', today())
            ->where('is_valid', true)
            ->count();

        // 🔍 LOGGING DEBUG - Devolviendo session activa
        \Log::info('📤 Devolviendo session activa', [
            'session_id' => $currentSession->id,
            'status' => $currentSession->status,
            'duration_minutes' => $currentDuration
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $currentSession->id,
                'started_at' => $currentSession->started_at,
                'status' => $currentSession->status,
                'current_duration_minutes' => $currentDuration,
                'pdvs_visited_today' => $todayPdvsVisited,
                'start_location' => [
                    'latitude' => $currentSession->start_latitude,
                    'longitude' => $currentSession->start_longitude,
                ],
                'notes' => $currentSession->notes,
            ]
        ]);
    }

    /**
     * Obtener historial de jornadas
     */
    public function getHistory(Request $request)
    {
        $request->validate([
            'limit' => 'nullable|integer|min:1|max:50',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $user = $request->user();
        $limit = $request->get('limit', 10);

        $query = WorkingSession::where('user_id', $user->id)
            ->where('status', 'completed');

        if ($request->date_from) {
            $query->whereDate('started_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('started_at', '<=', $request->date_to);
        }

        $sessions = $query->orderBy('started_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($session) {
                return [
                    'session_id' => $session->id,
                    'date' => $session->started_at->format('Y-m-d'),
                    'started_at' => $session->started_at,
                    'ended_at' => $session->ended_at,
                    'duration_minutes' => $session->total_duration_minutes,
                    'pdvs_visited' => $session->total_pdvs_visited,
                    'distance_km' => round($session->total_distance_km ?? 0, 2),
                    'status' => $session->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    /**
     * Calcular distancia total basada en tracking GPS
     * (Simplificado - en producción usar algoritmo más sofisticado)
     */
    private function calculateTotalDistance($userId, $startTime)
    {
        $locations = DB::table('gps_tracking')
            ->where('user_id', $userId)
            ->where('recorded_at', '>=', $startTime)
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude']);

        if ($locations->count() < 2) {
            return 0;
        }

        $totalDistance = 0;

        for ($i = 1; $i < $locations->count(); $i++) {
            $prev = $locations[$i - 1];
            $current = $locations[$i];

            // Fórmula de Haversine simplificada
            $earthRadius = 6371; // km
            $dLat = deg2rad($current->latitude - $prev->latitude);
            $dLon = deg2rad($current->longitude - $prev->longitude);

            $a = sin($dLat/2) * sin($dLat/2) +
                 cos(deg2rad($prev->latitude)) * cos(deg2rad($current->latitude)) *
                 sin($dLon/2) * sin($dLon/2);

            $c = 2 * atan2(sqrt($a), sqrt(1-$a));
            $distance = $earthRadius * $c;

            $totalDistance += $distance;
        }

        return $totalDistance;
    }
}
