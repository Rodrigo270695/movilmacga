<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WorkingSession;
use Illuminate\Support\Facades\DB;

class CheckGpsData extends Command
{
    protected $signature = 'check:gps-data';
    protected $description = 'Check GPS tracking data for working sessions';

    public function handle()
    {
        $this->info('🔍 Verificando datos de GPS tracking...');

        // Verificar total de puntos GPS
        $totalGpsPoints = DB::table('gps_tracking')->count();
        $this->info("📊 Total de puntos GPS en la base de datos: {$totalGpsPoints}");

        if ($totalGpsPoints === 0) {
            $this->error('❌ No hay puntos GPS en la base de datos');
            return;
        }

        // Mostrar algunos puntos de ejemplo
        $samplePoints = DB::table('gps_tracking')->take(3)->get();
        $this->info('📍 Puntos de ejemplo:');
        foreach ($samplePoints as $point) {
            $this->info("   Usuario: {$point->user_id}, Lat: {$point->latitude}, Lng: {$point->longitude}, Hora: {$point->recorded_at}");
        }

        $this->newLine();

        // Buscar jornadas con más puntos GPS
        $sessions = WorkingSession::with('user')
            ->where('status', 'completed')
            ->get();

        $sessionsWithGps = [];
        foreach ($sessions as $session) {
            $gpsCount = DB::table('gps_tracking')
                ->where('user_id', $session->user_id)
                ->whereBetween('recorded_at', [$session->started_at, $session->ended_at ?? now()])
                ->count();

            if ($gpsCount > 10) { // Solo jornadas con más de 10 puntos
                $sessionsWithGps[] = [
                    'session' => $session,
                    'gps_count' => $gpsCount
                ];
            }
        }

        // Ordenar por cantidad de puntos GPS
        usort($sessionsWithGps, function($a, $b) {
            return $b['gps_count'] - $a['gps_count'];
        });

        $this->info('🎯 JORNADAS CON TRACKING GPS (más de 10 puntos):');
        $this->newLine();

        foreach (array_slice($sessionsWithGps, 0, 5) as $data) {
            $session = $data['session'];
            $gpsCount = $data['gps_count'];

            $this->info("📊 Jornada {$session->id} - Usuario: {$session->user->name}");
            $this->info("   📅 Fecha: {$session->started_at->format('d/m/Y')}");
            $this->info("   ⏰ Inicio: {$session->started_at->format('H:i')} - Fin: " . ($session->ended_at ? $session->ended_at->format('H:i') : 'En curso'));
            $this->info("   📍 Puntos GPS: {$gpsCount}");
            $this->info("   🚀 Coordenadas inicio: {$session->start_latitude}, {$session->start_longitude}");
            $this->info("   🏁 Coordenadas fin: " . ($session->end_latitude ? "{$session->end_latitude}, {$session->end_longitude}" : "No definidas"));

            // Mostrar algunos puntos GPS de esta jornada
            $gpsPoints = DB::table('gps_tracking')
                ->where('user_id', $session->user_id)
                ->whereBetween('recorded_at', [$session->started_at, $session->ended_at ?? now()])
                ->orderBy('recorded_at', 'asc')
                ->take(3)
                ->get();

            $this->info("   📍 Primeros 3 puntos GPS:");
            foreach ($gpsPoints as $point) {
                $this->info("      {$point->recorded_at}: {$point->latitude}, {$point->longitude}");
            }

            $this->newLine();
        }

        if (empty($sessionsWithGps)) {
            $this->warn('⚠️ No se encontraron jornadas con más de 10 puntos GPS');
        }
    }
}
