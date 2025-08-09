<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\GpsTracking;
use App\Models\WorkingSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GpsTrackingSeeder extends Seeder
{
    /**
     * Seed GPS tracking data for testing real-time tracking
     */
    public function run(): void
    {
                // Preguntar si quiere limpiar datos existentes
        if ($this->command->confirm('¿Deseas limpiar los datos de GPS tracking existentes?', true)) {
            $this->command->info('Limpiando datos de GPS tracking...');

            // Finalizar sesiones activas de vendedores de forma segura
            $activeSessions = WorkingSession::where('status', 'active')
                ->whereHas('user', function($query) {
                    $query->role('Vendedor');
                })
                ->get();

            foreach ($activeSessions as $session) {
                try {
                    $session->update([
                        'status' => 'completed',
                        'ended_at' => Carbon::now()
                    ]);
                } catch (\Exception $e) {
                    // Si hay error de constraint, eliminar la sesión directamente
                    $this->command->warn("Eliminando sesión conflictiva del usuario {$session->user_id}");
                    $session->delete();
                }
            }

            // Eliminar datos GPS antiguos (mantener últimos 7 días)
            GpsTracking::where('recorded_at', '<', Carbon::now()->subDays(7))->delete();

            $this->command->info('✓ Datos antiguos limpiados');
        }

        // Buscar vendedores existentes
        $vendedores = User::role('Vendedor')->take(5)->get();

        if ($vendedores->isEmpty()) {
            $this->command->warn('No se encontraron vendedores. Ejecuta primero UserSeeder');
            return;
        }

        $this->command->info('Creando datos de tracking GPS para ' . $vendedores->count() . ' vendedores...');

                foreach ($vendedores as $vendedor) {
            // Verificar si ya tiene una sesión activa
            $hasActiveSession = WorkingSession::where('user_id', $vendedor->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasActiveSession && rand(1, 2) === 1) { // 50% probabilidad y no tiene sesión activa
                try {
                    $session = WorkingSession::create([
                        'user_id' => $vendedor->id,
                        'started_at' => Carbon::now()->subHours(rand(1, 8)),
                        'start_latitude' => $this->getRandomLimaLatitude(),
                        'start_longitude' => $this->getRandomLimaLongitude(),
                        'status' => 'active',
                        'session_data' => json_encode([
                            'device_info' => 'Mobile App v1.0',
                            'start_location' => 'Lima Centro'
                        ])
                    ]);

                    // Crear múltiples puntos GPS para simular movimiento
                    $this->createGpsTrackingPoints($vendedor->id);

                    $this->command->info("✓ Vendedor {$vendedor->first_name} {$vendedor->last_name} - EN LÍNEA con tracking GPS");
                } catch (\Exception $e) {
                    $this->command->warn("⚠ No se pudo crear sesión para {$vendedor->first_name} {$vendedor->last_name}: Ya tiene una sesión activa");
                }
            } else if ($hasActiveSession) {
                // Si ya tiene sesión activa, crear puntos GPS adicionales
                $this->createGpsTrackingPoints($vendedor->id);
                $this->command->info("✓ Vendedor {$vendedor->first_name} {$vendedor->last_name} - YA EN LÍNEA, agregando tracking GPS");
            } else {
                $this->command->info("✓ Vendedor {$vendedor->first_name} {$vendedor->last_name} - offline");
            }
        }

        $this->command->info('Datos de GPS tracking creados exitosamente!');
    }

        /**
     * Crear puntos de tracking GPS simulando movimiento por Lima
     */
    private function createGpsTrackingPoints(int $userId): void
    {
        // Eliminar puntos GPS antiguos para este usuario
        GpsTracking::where('user_id', $userId)->delete();

        $points = [];
        $targetDate = Carbon::parse('2025-08-06'); // Fecha específica para datos de prueba
        $startTime = $targetDate->copy()->addHours(8); // Empezar a las 8:00 AM

        // Punto de inicio (Centro de Lima)
        $currentLat = $this->getRandomLimaLatitude();
        $currentLng = $this->getRandomLimaLongitude();

        // Crear puntos GPS durante el día (8:00 AM hasta 6:00 PM)
        $endTime = $targetDate->copy()->addHours(18); // Terminar a las 6:00 PM
        $totalMinutes = $endTime->diffInMinutes($startTime); // 10 horas = 600 minutos
        $pointsCount = min(40, max(20, intval($totalMinutes / 15))); // 1 punto cada 15 min, máximo 40

        for ($i = 0; $i < $pointsCount; $i++) {
            // Simular movimiento gradual
            $currentLat += (rand(-50, 50) / 10000); // Pequeños cambios en latitud
            $currentLng += (rand(-50, 50) / 10000); // Pequeños cambios en longitud

            // Asegurar que se mantenga en Lima
            $currentLat = max(-12.2, min(-11.9, $currentLat));
            $currentLng = max(-77.2, min(-76.9, $currentLng));

            $recordTime = $startTime->copy()->addMinutes($i * ($totalMinutes / $pointsCount));

            $points[] = [
                'user_id' => $userId,
                'latitude' => $currentLat,
                'longitude' => $currentLng,
                'accuracy' => rand(3, 15), // 3-15 metros de precisión
                'speed' => $i > 0 ? rand(0, 25) : 0, // 0-25 km/h
                'heading' => rand(0, 360), // Dirección en grados
                'battery_level' => rand(20, 100), // 20-100% batería
                'is_mock_location' => false,
                'recorded_at' => $recordTime,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Crear el punto final del día (cerca del final de la jornada)
        $points[] = [
            'user_id' => $userId,
            'latitude' => $currentLat + (rand(-20, 20) / 10000),
            'longitude' => $currentLng + (rand(-20, 20) / 10000),
            'accuracy' => rand(3, 10),
            'speed' => rand(0, 15), // Velocidad más baja al final del día
            'heading' => rand(0, 360),
            'battery_level' => rand(30, 100),
            'is_mock_location' => false,
            'recorded_at' => $endTime->copy()->subMinutes(rand(5, 30)), // Cerca del final
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Insertar todos los puntos
        DB::table('gps_tracking')->insert($points);
    }

    /**
     * Obtener latitud aleatoria en Lima
     */
    private function getRandomLimaLatitude(): float
    {
        // Lima está aproximadamente entre -12.2 y -11.9
        return -12.0 + (rand(-20, 10) / 100);
    }

    /**
     * Obtener longitud aleatoria en Lima
     */
    private function getRandomLimaLongitude(): float
    {
        // Lima está aproximadamente entre -77.2 y -76.9
        return -77.05 + (rand(-15, 15) / 100);
    }
}
