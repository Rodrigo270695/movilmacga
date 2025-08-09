<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\WorkingSession;
use App\Models\GpsTracking;
use Carbon\Carbon;

class CheckTrackingStatus extends Command
{
    protected $signature = 'tracking:status';
    protected $description = 'Verificar el estado del sistema de tracking';

    public function handle()
    {
        $this->info('🔍 Verificando estado del sistema de tracking...');
        $this->newLine();

        // Verificar vendedores
        $vendedores = User::role('Vendedor')->count();
        $this->info("👥 Vendedores con rol: {$vendedores}");

        // Verificar sesiones activas
        $sesionesActivas = WorkingSession::where('status', 'active')->count();
        $this->info("🔄 Sesiones activas: {$sesionesActivas}");

        // Mostrar detalles de sesiones activas
        if ($sesionesActivas > 0) {
            $this->info("\n📋 Detalles de sesiones activas:");
            WorkingSession::where('status', 'active')
                ->with('user')
                ->get()
                ->each(function($session) {
                    $this->line("  - Usuario: {$session->user->email} | Status: {$session->status}");
                });
        }

        // Verificar GPS tracking de hoy
        $gpsHoy = GpsTracking::whereDate('recorded_at', Carbon::today())->count();
        $this->info("\n📍 Registros GPS de hoy: {$gpsHoy}");

        // Verificar GPS tracking válido de hoy
        $gpsValidoHoy = GpsTracking::validLocation()
            ->whereDate('recorded_at', Carbon::today())
            ->count();
        $this->info("✅ Registros GPS válidos de hoy: {$gpsValidoHoy}");

        // Verificar consulta específica del controlador
        $this->newLine();
        $this->info("🎯 Verificando consulta del mapa (como el controlador):");

        $dateFilter = Carbon::today()->toDateString();
        $startOfDay = Carbon::parse($dateFilter)->startOfDay();
        $endOfDay = Carbon::parse($dateFilter)->endOfDay();

        $locations = GpsTracking::with([
            'user:id,first_name,last_name,email',
            'user.activeWorkingSessions:id,user_id,started_at',
            'user.activeUserCircuits.circuit:id,name,code'
        ])
        ->select([
            'id', 'user_id', 'latitude', 'longitude', 'accuracy', 'speed',
            'heading', 'battery_level', 'is_mock_location', 'recorded_at'
        ])
        ->validLocation()
        ->whereBetween('recorded_at', [$startOfDay, $endOfDay])
        ->whereHas('user.activeWorkingSessions')
        ->whereRaw('recorded_at = (
            SELECT MAX(recorded_at)
            FROM gps_tracking g2
            WHERE g2.user_id = gps_tracking.user_id
            AND g2.latitude IS NOT NULL
            AND g2.longitude IS NOT NULL
            AND g2.recorded_at BETWEEN ? AND ?
        )', [$startOfDay, $endOfDay])
        ->get();

        $this->info("🗺️ Ubicaciones encontradas para el mapa: {$locations->count()}");

        if ($locations->count() > 0) {
            $this->info("\n📌 Detalles de ubicaciones:");
            $locations->each(function($location) {
                $this->line("  - Usuario: {$location->user->email}");
                $this->line("    Coordenadas: {$location->latitude}, {$location->longitude}");
                $this->line("    Registrado: {$location->recorded_at}");
                $this->line("    Sesión activa: " . ($location->user->activeWorkingSessions->count() > 0 ? 'Sí' : 'No'));
            });
        }

        $this->newLine();
        $this->info('✅ Verificación completada');
    }
}
