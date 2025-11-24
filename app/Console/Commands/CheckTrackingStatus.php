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

        // OPTIMIZACIÓN: Usar JOIN en lugar de subquery correlacionado
        $latestLocationsSubquery = \Illuminate\Support\Facades\DB::table('gps_tracking as g2')
            ->select('g2.user_id', \Illuminate\Support\Facades\DB::raw('MAX(g2.recorded_at) as max_recorded_at'))
            ->whereNotNull('g2.latitude')
            ->whereNotNull('g2.longitude')
            ->where('g2.is_mock_location', false)
            ->whereBetween('g2.recorded_at', [$startOfDay, $endOfDay])
            ->groupBy('g2.user_id');

        $locations = GpsTracking::with([
            'user:id,first_name,last_name,email',
            'user.activeWorkingSessions:id,user_id,started_at',
            'user.activeUserCircuits.circuit:id,name,code'
        ])
        ->select([
            'gps_tracking.id', 'gps_tracking.user_id', 'gps_tracking.latitude', 'gps_tracking.longitude', 
            'gps_tracking.accuracy', 'gps_tracking.speed',
            'gps_tracking.heading', 'gps_tracking.battery_level', 'gps_tracking.is_mock_location', 'gps_tracking.recorded_at'
        ])
        ->validLocation()
        ->whereBetween('gps_tracking.recorded_at', [$startOfDay, $endOfDay])
        ->whereHas('user.activeWorkingSessions')
        ->joinSub($latestLocationsSubquery, 'latest', function ($join) {
            $join->on('gps_tracking.user_id', '=', 'latest.user_id')
                 ->on('gps_tracking.recorded_at', '=', 'latest.max_recorded_at');
        })
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
