<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WorkingSession;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CloseActiveWorkingSessions extends Command
{
    protected $signature = 'sessions:close-active';
    protected $description = 'Cierra automáticamente todas las jornadas laborales activas a las 9 PM del día actual';

    public function handle()
    {
        // Obtener fecha/hora actual en zona horaria de Perú
        $peruNow = now('America/Lima');
        
        // Establecer hora de cierre: 9 PM del día actual (21:00)
        $closeDateTime = $peruNow->copy()->setTime(21, 0, 0);
        
        // Obtener inicio del día actual en Perú
        $todayStart = $peruNow->copy()->startOfDay();
        
        $this->info("🕘 Cerrando jornadas activas a las 9 PM del día actual...");
        $this->info("📅 Fecha de cierre: {$closeDateTime->format('Y-m-d H:i:s')} (Perú)");
        $this->newLine();
        
        // Buscar todas las jornadas activas o pausadas que iniciaron hoy
        $activeSessions = WorkingSession::whereIn('status', ['active', 'paused'])
            ->whereDate('started_at', $todayStart->toDateString())
            ->with('user')
            ->get();
        
        if ($activeSessions->isEmpty()) {
            $this->info("✅ No hay jornadas activas para cerrar.");
            return Command::SUCCESS;
        }
        
        $this->info("📋 Encontradas {$activeSessions->count()} jornada(s) activa(s) para cerrar:");
        $this->newLine();
        
        $closedCount = 0;
        $errors = [];
        
        foreach ($activeSessions as $session) {
            try {
                DB::beginTransaction();
                
                // Calcular duración total
                $totalDuration = (int) round(abs($session->started_at->diffInMinutes($closeDateTime)));
                
                // Contar PDVs visitados en esta jornada
                $pdvsVisited = DB::table('pdv_visits')
                    ->where('user_id', $session->user_id)
                    ->where('check_in_at', '>=', $session->started_at)
                    ->where('check_in_at', '<=', $closeDateTime)
                    ->where('is_valid', true)
                    ->count();
                
                // Calcular distancia total basada en GPS tracking (si existe)
                $totalDistance = $this->calculateTotalDistance(
                    $session->user_id,
                    $session->started_at,
                    $closeDateTime
                );
                
                // Actualizar la jornada
                $session->update([
                    'ended_at' => $closeDateTime,
                    'status' => 'completed',
                    'total_duration_minutes' => $totalDuration,
                    'total_pdvs_visited' => $pdvsVisited,
                    'total_distance_km' => $totalDistance,
                    'notes' => ($session->notes ? $session->notes . ' | ' : '') . 
                               'Cerrada automáticamente a las 9 PM del día actual.',
                ]);
                
                DB::commit();
                
                $closedCount++;
                $this->info("✅ Jornada #{$session->id} cerrada para usuario: {$session->user->email} (ID: {$session->user_id})");
                $this->line("   - Duración: {$totalDuration} minutos");
                $this->line("   - PDVs visitados: {$pdvsVisited}");
                $this->line("   - Distancia: " . round($totalDistance, 2) . " km");
                
            } catch (\Exception $e) {
                DB::rollBack();
                $errors[] = [
                    'session_id' => $session->id,
                    'user_id' => $session->user_id,
                    'error' => $e->getMessage()
                ];
                $this->error("❌ Error al cerrar jornada #{$session->id}: {$e->getMessage()}");
            }
        }
        
        $this->newLine();
        
        if ($closedCount > 0) {
            $this->info("✅ Proceso completado: {$closedCount} jornada(s) cerrada(s) exitosamente.");
        }
        
        if (!empty($errors)) {
            $this->error("⚠️  Se encontraron " . count($errors) . " error(es):");
            foreach ($errors as $error) {
                $this->line("   - Jornada #{$error['session_id']} (Usuario #{$error['user_id']}): {$error['error']}");
            }
        }
        
        return Command::SUCCESS;
    }
    
    /**
     * Calcular distancia total basada en tracking GPS
     */
    private function calculateTotalDistance($userId, $startTime, $endTime)
    {
        $locations = DB::table('gps_tracking')
            ->where('user_id', $userId)
            ->where('recorded_at', '>=', $startTime)
            ->where('recorded_at', '<=', $endTime)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude']);
        
        if ($locations->count() < 2) {
            return 0;
        }
        
        $totalDistance = 0;
        
        for ($i = 1; $i < $locations->count(); $i++) {
            $prev = $locations[$i - 1];
            $current = $locations[$i];
            
            // Fórmula de Haversine
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

