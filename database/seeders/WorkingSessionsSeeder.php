<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\WorkingSession;
use App\Models\GpsTracking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WorkingSessionsSeeder extends Seeder
{
    /**
     * Seed working sessions data for testing reports
     */
    public function run(): void
    {
        // Preguntar si quiere limpiar datos existentes
        if ($this->command->confirm('¿Deseas limpiar los datos de jornadas laborales existentes?', true)) {
            $this->command->info('Limpiando datos de jornadas laborales...');

            // Eliminar datos relacionados
            GpsTracking::truncate();
            WorkingSession::truncate();

            $this->command->info('✓ Datos antiguos limpiados');
        }

        // Buscar vendedores existentes
        $vendedores = User::role('Vendedor')
            ->where('status', true)
            ->get();

        if ($vendedores->isEmpty()) {
            $this->command->error('❌ No se encontraron vendedores. Ejecuta primero el seeder de usuarios.');
            return;
        }

        $this->command->info("📊 Creando jornadas laborales para {$vendedores->count()} vendedores...");

        // Crear jornadas para los últimos 7 días
        $startDate = Carbon::now()->subDays(7);
        $endDate = Carbon::now();

        foreach ($vendedores as $vendedor) {
            $this->createWorkingSessionsForUser($vendedor, $startDate, $endDate);
        }

        $this->command->info('🎉 ¡Datos de jornadas laborales creados exitosamente!');
        $this->command->info('👉 URL del reporte: /reportes/jornadas-laborales');
    }

    /**
     * Crear jornadas laborales para un usuario específico
     */
    private function createWorkingSessionsForUser(User $user, Carbon $startDate, Carbon $endDate): void
    {
        $currentDate = $startDate->copy();
        $sessionsCreated = 0;

        while ($currentDate <= $endDate) {
            // Saltar fines de semana (sábado = 6, domingo = 0)
            if ($currentDate->dayOfWeek === 0 || $currentDate->dayOfWeek === 6) {
                $currentDate->addDay();
                continue;
            }

            // 80% de probabilidad de tener jornada en días laborales
            if (rand(1, 100) <= 80) {
                $this->createWorkingSession($user, $currentDate);
                $sessionsCreated++;
            }

            $currentDate->addDay();
        }

        $this->command->info("✓ Vendedor {$user->first_name} {$user->last_name} - {$sessionsCreated} jornadas creadas");
    }

    /**
     * Crear una jornada laboral específica
     */
    private function createWorkingSession(User $user, Carbon $date): void
    {
        // Hora de inicio entre 7:00 AM y 9:00 AM
        $startHour = rand(7, 9);
        $startMinute = rand(0, 59);
        $startTime = $date->copy()->setTime($startHour, $startMinute);

        // Duración entre 6 y 10 horas
        $durationMinutes = rand(360, 600); // 6-10 horas
        $endTime = $startTime->copy()->addMinutes($durationMinutes);

        // Coordenadas de inicio (Lima)
        $startLat = $this->getRandomLimaLatitude();
        $startLng = $this->getRandomLimaLongitude();

        // Coordenadas de fin (cerca del inicio)
        $endLat = $startLat + (rand(-20, 20) / 10000);
        $endLng = $startLng + (rand(-20, 20) / 10000);

        // Estado de la jornada
        $status = $this->getRandomStatus();

        // Si está activa, no tener hora de fin
        $actualEndTime = $status === 'active' ? null : $endTime;

        // Crear la jornada
        $session = WorkingSession::create([
            'user_id' => $user->id,
            'started_at' => $startTime,
            'ended_at' => $actualEndTime,
            'start_latitude' => $startLat,
            'start_longitude' => $startLng,
            'end_latitude' => $status !== 'active' ? $endLat : null,
            'end_longitude' => $status !== 'active' ? $endLng : null,
            'total_distance_km' => $status !== 'active' ? rand(15, 45) : null,
            'total_pdvs_visited' => rand(8, 20),
            'total_duration_minutes' => $status !== 'active' ? $durationMinutes : null,
            'status' => $status,
            'notes' => $this->getRandomNotes(),
            'session_data' => [
                'device_info' => 'Android 12',
                'app_version' => '1.2.3',
                'battery_start' => rand(80, 100),
                'battery_end' => $status !== 'active' ? rand(20, 60) : null,
            ],
        ]);

        // Crear puntos GPS para la jornada
        $this->createGpsTrackingForSession($session, $startTime, $actualEndTime ?? $endTime);

        $this->command->info("  📅 {$date->format('d/m/Y')} - {$startTime->format('H:i')} ({$status})");
    }

    /**
     * Crear puntos GPS para una jornada
     */
    private function createGpsTrackingForSession(WorkingSession $session, Carbon $startTime, Carbon $endTime): void
    {
        $points = [];
        $currentTime = $startTime->copy();

        // Crear puntos cada 15 minutos
        $interval = 15; // minutos

        while ($currentTime <= $endTime) {
            // Simular movimiento gradual
            $baseLat = $session->start_latitude;
            $baseLng = $session->start_longitude;

            // Calcular progreso (0 a 1)
            $progress = $startTime->diffInMinutes($currentTime) / $startTime->diffInMinutes($endTime);

            // Interpolar posición
            $currentLat = $baseLat + (($session->end_latitude ?? $baseLat) - $baseLat) * $progress;
            $currentLng = $baseLng + (($session->end_longitude ?? $baseLng) - $baseLng) * $progress;

            // Agregar variación aleatoria
            $currentLat += (rand(-50, 50) / 10000);
            $currentLng += (rand(-50, 50) / 10000);

            $points[] = [
                'user_id' => $session->user_id,
                'latitude' => $currentLat,
                'longitude' => $currentLng,
                'accuracy' => rand(3, 15),
                'speed' => rand(0, 25),
                'heading' => rand(0, 360),
                'battery_level' => rand(20, 100),
                'is_mock_location' => false,
                'recorded_at' => $currentTime,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $currentTime->addMinutes($interval);
        }

        // Insertar puntos GPS
        if (!empty($points)) {
            DB::table('gps_tracking')->insert($points);
        }
    }

    /**
     * Obtener estado aleatorio para la jornada
     */
    private function getRandomStatus(): string
    {
        $statuses = [
            'completed' => 70, // 70% completadas
            'active' => 20,    // 20% activas
            'paused' => 8,     // 8% pausadas
            'cancelled' => 2,  // 2% canceladas
        ];

        $random = rand(1, 100);
        $cumulative = 0;

        foreach ($statuses as $status => $probability) {
            $cumulative += $probability;
            if ($random <= $cumulative) {
                return $status;
            }
        }

        return 'completed';
    }

    /**
     * Obtener notas aleatorias para la jornada
     */
    private function getRandomNotes(): ?string
    {
        $notes = [
            null,
            'Jornada normal, sin incidentes',
            'Algunos PDVs cerrados por mantenimiento',
            'Excelente productividad hoy',
            'Tráfico pesado en la mañana',
            'Clima favorable para las visitas',
            'Algunos clientes no disponibles',
            'Ruta optimizada, buena eficiencia',
        ];

        return $notes[array_rand($notes)];
    }

    /**
     * Obtener latitud aleatoria en Lima
     */
    private function getRandomLimaLatitude(): float
    {
        return -12.0 + (rand(-200, 200) / 1000); // Entre -12.2 y -11.8
    }

    /**
     * Obtener longitud aleatoria en Lima
     */
    private function getRandomLimaLongitude(): float
    {
        return -77.0 + (rand(-200, 200) / 1000); // Entre -77.2 y -76.8
    }
}
