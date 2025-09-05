<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\WorkingSession;
use App\Models\GpsTracking;
use App\Models\PdvVisit;
use App\Models\Route;
use App\Models\Pdv;
use App\Models\RouteVisitDate;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WorkingSessionsAndTrackingSeeder extends Seeder
{
    /**
     * Seed comprehensive working sessions with realistic GPS tracking and PDV visits
     */
    public function run(): void
    {
        $this->command->info('🚀 Iniciando seeder completo de jornadas laborales...');

        // Preguntar si quiere limpiar datos existentes
        if ($this->command->confirm('¿Deseas limpiar los datos existentes de jornadas laborales, GPS tracking y visitas PDV?', true)) {
            $this->command->info('🧹 Limpiando datos existentes...');

            try {
                // Deshabilitar verificación de claves foráneas temporalmente
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                // Eliminar datos relacionados en orden correcto
                DB::table('pdv_visit_form_responses')->truncate();
                DB::table('pdv_visits')->truncate();
                DB::table('gps_tracking')->truncate();
                DB::table('working_sessions')->truncate();

                // Rehabilitar verificación de claves foráneas
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');

                $this->command->info('✅ Datos antiguos limpiados');
            } catch (\Exception $e) {
                $this->command->error('❌ Error limpiando datos: ' . $e->getMessage());

                // Asegurar que las claves foráneas estén habilitadas
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');

                $this->command->warn('⚠️ Continuando sin limpiar datos existentes...');
            }
        }

        // Verificar que existan datos base
        $this->verifyBaseData();

        // Obtener vendedores activos con circuitos asignados
        $vendedores = User::role('Vendedor')
            ->where('status', true)
            ->whereHas('userCircuits')
            ->with(['userCircuits.circuit.routes.pdvs'])
            ->get();

        if ($vendedores->isEmpty()) {
            $this->command->error('❌ No se encontraron vendedores con circuitos asignados.');
            return;
        }

        $this->command->info("👥 Encontrados {$vendedores->count()} vendedores activos");

        // Crear jornadas para los últimos 10 días
        $startDate = Carbon::now()->subDays(10);
        $endDate = Carbon::now();

        foreach ($vendedores as $vendedor) {
            $this->createComprehensiveWorkingSessions($vendedor, $startDate, $endDate);
        }

        $this->showSummary();
    }

    /**
     * Verificar que existan datos base necesarios
     */
    private function verifyBaseData(): void
    {
        $pdvCount = Pdv::count();
        $routeCount = Route::count();
        $userCount = User::role('Vendedor')->count();

        $this->command->info("📊 Datos base disponibles:");
        $this->command->info("   • PDVs: {$pdvCount}");
        $this->command->info("   • Rutas: {$routeCount}");
        $this->command->info("   • Vendedores: {$userCount}");

        if ($pdvCount === 0 || $routeCount === 0 || $userCount === 0) {
            $this->command->warn('⚠️ Faltan datos base. Ejecuta los seeders correspondientes primero.');
        }
    }

    /**
     * Crear jornadas laborales completas para un vendedor
     */
    private function createComprehensiveWorkingSessions(User $vendedor, Carbon $startDate, Carbon $endDate): void
    {
        $currentDate = $startDate->copy();
        $sessionsCreated = 0;
        $pdvVisitsCreated = 0;
        $gpsPointsCreated = 0;

        // Obtener rutas del vendedor
        $vendorRoutes = $this->getVendorRoutes($vendedor);

        if ($vendorRoutes->isEmpty()) {
            $this->command->warn("⚠️ Vendedor {$vendedor->name} no tiene rutas asignadas");
            return;
        }

        while ($currentDate <= $endDate) {
            // Saltar fines de semana
            if ($currentDate->dayOfWeek === 0 || $currentDate->dayOfWeek === 6) {
                $currentDate->addDay();
                continue;
            }

            // 85% de probabilidad de tener jornada en días laborales
            if (rand(1, 100) <= 85) {
                $route = $vendorRoutes->random();
                $sessionData = $this->createRealisticWorkingSession($vendedor, $currentDate, $route);

                if ($sessionData) {
                    $sessionsCreated++;
                    $pdvVisitsCreated += $sessionData['pdv_visits'];
                    $gpsPointsCreated += $sessionData['gps_points'];
                }
            }

            $currentDate->addDay();
        }

        $this->command->info("✅ {$vendedor->name}:");
        $this->command->info("   📅 Jornadas: {$sessionsCreated}");
        $this->command->info("   🏪 Visitas PDV: {$pdvVisitsCreated}");
        $this->command->info("   📍 Puntos GPS: {$gpsPointsCreated}");
    }

    /**
     * Obtener rutas del vendedor
     */
    private function getVendorRoutes(User $vendedor)
    {
        return Route::whereHas('circuit.userCircuits', function ($query) use ($vendedor) {
            $query->where('user_id', $vendedor->id)
                  ->where('status', true);
        })->with(['pdvs' => function ($query) {
            $query->where('status', 'vende');
        }])->get();
    }

    /**
     * Crear una jornada laboral realista con todos los datos relacionados
     */
    private function createRealisticWorkingSession(User $vendedor, Carbon $date, Route $route): ?array
    {
        // Configurar horarios realistas
        $startHour = rand(7, 9);
        $startMinute = rand(0, 59);
        $startTime = $date->copy()->setTime($startHour, $startMinute);

        // Duración entre 6 y 9 horas
        $durationMinutes = rand(360, 540);
        $endTime = $startTime->copy()->addMinutes($durationMinutes);

        // Estado de la jornada
        $status = $this->getWeightedRandomStatus();
        $actualEndTime = $status === 'active' ? null : $endTime;

        // Coordenadas realistas de Lima
        $startCoords = $this->getRealisticLimaCoordinates();
        $endCoords = $this->getCoordinatesNearby($startCoords['lat'], $startCoords['lng']);

        // Crear jornada laboral
        $session = WorkingSession::create([
            'user_id' => $vendedor->id,
            'started_at' => $startTime,
            'ended_at' => $actualEndTime,
            'start_latitude' => $startCoords['lat'],
            'start_longitude' => $startCoords['lng'],
            'end_latitude' => $status !== 'active' ? $endCoords['lat'] : null,
            'end_longitude' => $status !== 'active' ? $endCoords['lng'] : null,
            'total_distance_km' => $status !== 'active' ? rand(25, 65) : null,
            'total_pdvs_visited' => 0, // Se actualizará después
            'total_duration_minutes' => $status !== 'active' ? $durationMinutes : null,
            'status' => $status,
            'notes' => $this->getRandomNotes(),
            'session_data' => [
                'device_info' => $this->getRandomDeviceInfo(),
                'app_version' => '2.1.0',
                'battery_start' => rand(75, 100),
                'battery_end' => $status !== 'active' ? rand(15, 65) : null,
                'route_assigned' => $route->name,
                'weather' => $this->getRandomWeather(),
            ],
        ]);

        // Crear fecha de visita para la ruta
        RouteVisitDate::updateOrCreate([
            'route_id' => $route->id,
            'visit_date' => $date->format('Y-m-d'),
        ], [
            'assigned_user_id' => $vendedor->id,
            'status' => 'scheduled',
            'notes' => "Jornada laboral del {$date->format('d/m/Y')}",
        ]);

        // Crear GPS tracking realista
        $gpsPoints = $this->createRealisticGpsTracking($session, $startTime, $actualEndTime ?? $endTime, $route);

        // Crear visitas a PDVs
        $pdvVisits = $this->createRealisticPdvVisits($session, $route, $startTime, $actualEndTime ?? $endTime);

        // Actualizar total de PDVs visitados
        $session->update(['total_pdvs_visited' => count($pdvVisits)]);

        return [
            'session' => $session,
            'pdv_visits' => count($pdvVisits),
            'gps_points' => count($gpsPoints),
        ];
    }

    /**
     * Crear GPS tracking realista para una jornada
     */
    private function createRealisticGpsTracking(WorkingSession $session, Carbon $startTime, Carbon $endTime, Route $route): array
    {
        $points = [];
        $currentTime = $startTime->copy();

        // Obtener PDVs de la ruta para simular visitas
        $routePdvs = $route->pdvs->where('status', 'vende')->take(rand(3, 8));

        // Crear punto de inicio
        $points[] = [
            'user_id' => $session->user_id,
            'latitude' => $session->start_latitude,
            'longitude' => $session->start_longitude,
            'accuracy' => rand(3, 8),
            'speed' => 0,
            'heading' => rand(0, 360),
            'battery_level' => rand(85, 100),
            'is_mock_location' => false,
            'recorded_at' => $currentTime,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Simular movimiento hacia PDVs
        $totalDuration = $startTime->diffInMinutes($endTime);
        $pdvIndex = 0;

        // Generar puntos de tracking entre inicio y fin
        $totalPoints = rand(20, 40); // Más puntos para una línea más detallada
        $timeInterval = $startTime->diffInMinutes($endTime) / $totalPoints;

        for ($i = 1; $i <= $totalPoints; $i++) {
            $currentTime->addMinutes($timeInterval);

            if ($currentTime > $endTime) break;

            // Calcular posición interpolada entre inicio y fin
            $progress = $i / $totalPoints;
            $currentLat = $session->start_latitude + (($session->end_latitude - $session->start_latitude) * $progress);
            $currentLng = $session->start_longitude + (($session->end_longitude - $session->start_longitude) * $progress);

            // Agregar variación realista (como si el vendedor se moviera por calles)
            $currentLat += (rand(-50, 50) / 10000);
            $currentLng += (rand(-50, 50) / 10000);

            $points[] = [
                'user_id' => $session->user_id,
                'latitude' => $currentLat,
                'longitude' => $currentLng,
                'accuracy' => rand(3, 10),
                'speed' => rand(0, 40),
                'heading' => rand(0, 360),
                'battery_level' => max(10, rand(60, 95) - ($i * 1)),
                'is_mock_location' => rand(1, 100) <= 1, // 1% GPS simulado
                'recorded_at' => $currentTime,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Punto final si la jornada está completada
        if ($session->status === 'completed' && $session->end_latitude && $session->end_longitude) {
            $points[] = [
                'user_id' => $session->user_id,
                'latitude' => $session->end_latitude,
                'longitude' => $session->end_longitude,
                'accuracy' => rand(3, 8),
                'speed' => 0,
                'heading' => rand(0, 360),
                'battery_level' => rand(15, 50),
                'is_mock_location' => false,
                'recorded_at' => $endTime,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insertar puntos GPS en lotes
        if (!empty($points)) {
            foreach (array_chunk($points, 100) as $chunk) {
                DB::table('gps_tracking')->insert($chunk);
            }
        }

        return $points;
    }

    /**
     * Crear visitas realistas a PDVs
     */
    private function createRealisticPdvVisits(WorkingSession $session, Route $route, Carbon $startTime, Carbon $endTime): array
    {
        $visits = [];
        $routePdvs = $route->pdvs->where('status', 'vende')->shuffle();
        $numberOfVisits = rand(6, min(15, $routePdvs->count()));

        $pdvsToVisit = $routePdvs->take($numberOfVisits);
        $currentTime = $startTime->copy()->addMinutes(rand(30, 60));

        foreach ($pdvsToVisit as $index => $pdv) {
            // Solo crear visita si hay tiempo suficiente
            if ($currentTime >= $endTime) break;

            // Tiempo de llegada
            $checkInTime = $currentTime->copy();

            // Duración de la visita (15 a 45 minutos)
            $visitDuration = rand(15, 45);
            $checkOutTime = $checkInTime->copy()->addMinutes($visitDuration);

            // Solo completar la visita si la jornada está completada
            $actualCheckOut = ($session->status === 'completed' && $checkOutTime <= $endTime)
                ? $checkOutTime
                : null;

            $visit = PdvVisit::create([
                'user_id' => $session->user_id,
                'pdv_id' => $pdv->id,
                'visit_date' => $startTime->format('Y-m-d'),
                'check_in_at' => $checkInTime,
                'check_out_at' => $actualCheckOut,
                'latitude' => $pdv->latitude + (rand(-10, 10) / 100000),
                'longitude' => $pdv->longitude + (rand(-10, 10) / 100000),
                'notes' => $this->getRandomVisitNotes(),
                'status' => $actualCheckOut ? 'completed' : 'in_progress',
                'visit_data' => [
                    'visit_order' => $index + 1,
                    'planned_duration' => $visitDuration,
                    'distance_from_pdv' => rand(5, 25),
                    'weather_conditions' => $this->getRandomWeather(),
                ],
            ]);

            $visits[] = $visit;

            // Tiempo hasta el siguiente PDV
            $currentTime->addMinutes($visitDuration + rand(10, 30));
        }

        return $visits;
    }

    /**
     * Obtener coordenadas realistas de Lima
     */
    private function getRealisticLimaCoordinates(): array
    {
        // Zonas específicas de Lima
        $zones = [
            ['lat' => -12.0464, 'lng' => -77.0428], // Centro de Lima
            ['lat' => -12.0931, 'lng' => -77.0465], // San Isidro
            ['lat' => -12.1211, 'lng' => -77.0150], // Surco
            ['lat' => -12.0694, 'lng' => -77.0784], // Callao
            ['lat' => -11.9894, 'lng' => -77.0531], // Los Olivos
            ['lat' => -12.1697, 'lng' => -76.9739], // Villa El Salvador
        ];

        $zone = $zones[array_rand($zones)];

        return [
            'lat' => $zone['lat'] + (rand(-100, 100) / 10000),
            'lng' => $zone['lng'] + (rand(-100, 100) / 10000),
        ];
    }

    /**
     * Obtener coordenadas cercanas a un punto
     */
    private function getCoordinatesNearby(float $lat, float $lng, float $maxDistance = 0.05): array
    {
        return [
            'lat' => $lat + (rand(-500, 500) / 10000),
            'lng' => $lng + (rand(-500, 500) / 10000),
        ];
    }

    /**
     * Obtener estado aleatorio ponderado
     */
    private function getWeightedRandomStatus(): string
    {
        $statuses = [
            'completed' => 75, // 75% completadas
            'active' => 15,    // 15% activas
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
     * Obtener información de dispositivo aleatoria
     */
    private function getRandomDeviceInfo(): string
    {
        $devices = [
            'Android 12 (Samsung Galaxy A54)',
            'Android 13 (Xiaomi Redmi Note 12)',
            'Android 11 (Huawei P30 Lite)',
            'Android 12 (Samsung Galaxy S21)',
            'Android 13 (OnePlus Nord)',
            'iOS 16.5 (iPhone 12)',
            'iOS 17.1 (iPhone 14)',
        ];

        return $devices[array_rand($devices)];
    }

    /**
     * Obtener clima aleatorio
     */
    private function getRandomWeather(): string
    {
        $weather = ['Soleado', 'Nublado', 'Parcialmente nublado', 'Llovizna', 'Despejado'];
        return $weather[array_rand($weather)];
    }

    /**
     * Obtener notas aleatorias para jornadas
     */
    private function getRandomNotes(): ?string
    {
        $notes = [
            null,
            'Jornada productiva, todos los objetivos cumplidos',
            'Algunos PDVs cerrados por feriado local',
            'Excelente recepción de los clientes',
            'Tráfico intenso en zona céntrica',
            'Clima favorable para las visitas',
            'Ruta optimizada con buenos resultados',
            'Algunos inconvenientes menores con GPS',
            'Día exitoso con buenas ventas',
        ];

        return $notes[array_rand($notes)];
    }

    /**
     * Obtener notas aleatorias para visitas
     */
    private function getRandomVisitNotes(): ?string
    {
        $notes = [
            null,
            'Cliente muy satisfecho con el servicio',
            'Realizó pedido adicional',
            'Sugirió mejoras en el producto',
            'Cliente nuevo, buena acogida',
            'Visita de seguimiento exitosa',
            'Resolvió dudas sobre facturación',
            'Programó próxima visita',
        ];

        return $notes[array_rand($notes)];
    }

    /**
     * Mostrar resumen final
     */
    private function showSummary(): void
    {
        $totalSessions = WorkingSession::count();
        $totalGpsPoints = GpsTracking::count();
        $totalPdvVisits = PdvVisit::count();

        $this->command->info('');
        $this->command->info('🎉 ¡Seeder completado exitosamente!');
        $this->command->info('📊 Resumen de datos creados:');
        $this->command->info("   • Jornadas laborales: {$totalSessions}");
        $this->command->info("   • Puntos GPS: {$totalGpsPoints}");
        $this->command->info("   • Visitas PDV: {$totalPdvVisits}");
        $this->command->info('');
        $this->command->info('🔗 URLs para probar:');
        $this->command->info('   • Reporte: /reportes/jornadas-laborales');
        $this->command->info('   • Tracking: /mapas/tracking');
        $this->command->info('');
        $this->command->info('💡 Datos listos para visualizar GPS tracking en el modal');
    }
}
