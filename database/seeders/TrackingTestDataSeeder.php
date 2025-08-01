<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Circuit;
use App\Models\UserCircuit;
use App\Models\WorkingSession;
use App\Models\GpsTracking;
use App\Models\PdvVisit;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TrackingTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Creando datos de prueba para el sistema de tracking GPS...');

        // Obtener rol Vendedor (ya creado en RolePermissionSeeder)
        $vendedorRole = Role::where('name', 'Vendedor')->first();

        if (!$vendedorRole) {
            $this->command->error('❌ El rol "Vendedor" no existe. Ejecuta primero el RolePermissionSeeder.');
            return;
        }

        // Obtener algunos circuitos existentes
        $circuits = Circuit::limit(3)->get();

        if ($circuits->count() === 0) {
            $this->command->warn('❌ No hay circuitos disponibles. Crea circuitos primero.');
            return;
        }

        // Crear usuarios vendedores de prueba
        $vendedores = [
            [
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'email' => 'carlos.mendoza@movilmacga.com',
                'circuit_id' => $circuits[0]->id ?? null
            ],
            [
                'first_name' => 'María',
                'last_name' => 'García',
                'email' => 'maria.garcia@movilmacga.com',
                'circuit_id' => $circuits[1]->id ?? null
            ],
            [
                'first_name' => 'Luis',
                'last_name' => 'Rodríguez',
                'email' => 'luis.rodriguez@movilmacga.com',
                'circuit_id' => $circuits[2]->id ?? null
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'Torres',
                'email' => 'ana.torres@movilmacga.com',
                'circuit_id' => $circuits[0]->id ?? null // Mismo circuito que Carlos
            ]
        ];

        $createdUsers = [];

        foreach ($vendedores as $vendedorData) {
            $user = User::firstOrCreate(
                ['email' => $vendedorData['email']],
                [
                    'name' => $vendedorData['first_name'] . ' ' . $vendedorData['last_name'],
                    'dni' => '7' . str_pad(rand(1000000, 9999999), 7, '0', STR_PAD_LEFT),
                    'first_name' => $vendedorData['first_name'],
                    'last_name' => $vendedorData['last_name'],
                    'username' => strtolower($vendedorData['first_name'] . '.' . $vendedorData['last_name']),
                    'phone_number' => '+51 9' . rand(10000000, 99999999),
                    'status' => true,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );

            // Asignar rol vendedor
            if (!$user->hasRole('Vendedor')) {
                $user->assignRole('Vendedor');
            }

                        // Asignar circuito
            if ($vendedorData['circuit_id']) {
                UserCircuit::firstOrCreate([
                    'user_id' => $user->id,
                    'circuit_id' => $vendedorData['circuit_id'],
                    'is_active' => true
                ], [
                    'assigned_date' => now()->toDateString(),
                    'assignment_data' => ['assigned_by' => 'seeder'],
                    'priority' => 1,
                    'valid_from' => now()->toDateString()
                ]);
            }

            $createdUsers[] = $user;
            $this->command->info("✅ Usuario creado: {$user->first_name} {$user->last_name}");
        }

        // Crear sesiones de trabajo activas para algunos usuarios (simular usuarios online)
        $now = Carbon::now();
        $activeUsers = collect($createdUsers)->take(2); // Solo 2 usuarios online

        foreach ($activeUsers as $user) {
            $session = WorkingSession::create([
                'user_id' => $user->id,
                'started_at' => $now->copy()->subHours(rand(1, 4)),
                'ended_at' => null, // Sesión activa
                'location_start' => json_encode([
                    'latitude' => -12.0464 + (rand(-100, 100) / 10000), // Lima área
                    'longitude' => -77.0428 + (rand(-100, 100) / 10000)
                ]),
                'session_data' => json_encode(['device' => 'mobile', 'version' => '1.0'])
            ]);

            // Crear tracking GPS para estas sesiones activas
            $this->createGpsTrackingData($user, $session);

            $this->command->info("📱 Sesión activa creada para: {$user->first_name}");
        }

        // Crear algunas sesiones finalizadas (historial)
        $inactiveUsers = collect($createdUsers)->skip(2);

        foreach ($inactiveUsers as $user) {
            $sessionStart = $now->copy()->subDays(rand(1, 7))->setHour(rand(8, 10));
            $sessionEnd = $sessionStart->copy()->addHours(rand(6, 8));

            $session = WorkingSession::create([
                'user_id' => $user->id,
                'started_at' => $sessionStart,
                'ended_at' => $sessionEnd,
                'location_start' => json_encode([
                    'latitude' => -12.0464 + (rand(-200, 200) / 10000),
                    'longitude' => -77.0428 + (rand(-200, 200) / 10000)
                ]),
                'location_end' => json_encode([
                    'latitude' => -12.0464 + (rand(-200, 200) / 10000),
                    'longitude' => -77.0428 + (rand(-200, 200) / 10000)
                ]),
                'session_data' => json_encode(['device' => 'mobile', 'version' => '1.0'])
            ]);

            // Crear tracking GPS histórico
            $this->createHistoricalGpsData($user, $sessionStart, $sessionEnd);

            $this->command->info("📊 Historial creado para: {$user->first_name}");
        }

        $this->command->info('');
        $this->command->info('🎉 ¡Datos de prueba creados exitosamente!');
        $this->command->info('📊 Resumen:');
        $this->command->info("   👥 Vendedores creados: " . count($vendedores));
        $this->command->info("   📱 Usuarios online: " . $activeUsers->count());
        $this->command->info("   📜 Usuarios con historial: " . $inactiveUsers->count());
        $this->command->info('');
        $this->command->info('🔑 Credenciales de acceso:');
        foreach ($createdUsers as $user) {
            $this->command->info("   📧 {$user->email} / password123");
        }
    }

    /**
     * Crear datos de GPS tracking para usuarios activos
     */
    private function createGpsTrackingData(User $user, WorkingSession $session)
    {
        $startTime = $session->started_at;
        $now = Carbon::now();

        // Coordenadas base (Lima)
        $baseLat = -12.0464;
        $baseLng = -77.0428;

        // Crear puntos cada 10-15 minutos desde el inicio de la sesión
        $currentTime = $startTime->copy();
        $points = [];

        while ($currentTime <= $now) {
            $points[] = [
                'user_id' => $user->id,
                'working_session_id' => $session->id,
                'latitude' => $baseLat + (rand(-500, 500) / 10000), // Radio ~5km
                'longitude' => $baseLng + (rand(-500, 500) / 10000),
                'accuracy' => rand(3, 15),
                'speed' => rand(0, 50) / 10, // 0-5 km/h
                'heading' => rand(0, 360),
                'recorded_at' => $currentTime->toDateTimeString(),
                'battery_level' => rand(20, 100),
                'created_at' => now(),
                'updated_at' => now()
            ];

            $currentTime->addMinutes(rand(10, 15));
        }

        if (!empty($points)) {
            GpsTracking::insert($points);
        }
    }

    /**
     * Crear datos de GPS históricos
     */
    private function createHistoricalGpsData(User $user, Carbon $start, Carbon $end)
    {
        // Coordenadas base
        $baseLat = -12.0464;
        $baseLng = -77.0428;

        // Crear puntos cada 20-30 minutos durante la sesión
        $currentTime = $start->copy();
        $points = [];

        while ($currentTime <= $end) {
            $points[] = [
                'user_id' => $user->id,
                'working_session_id' => null,
                'latitude' => $baseLat + (rand(-800, 800) / 10000),
                'longitude' => $baseLng + (rand(-800, 800) / 10000),
                'accuracy' => rand(5, 20),
                'speed' => rand(0, 80) / 10,
                'heading' => rand(0, 360),
                'recorded_at' => $currentTime->toDateTimeString(),
                'metadata' => json_encode([
                    'battery_level' => rand(10, 100),
                    'signal_strength' => rand(40, 100)
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ];

            $currentTime->addMinutes(rand(20, 30));
        }

        if (!empty($points)) {
            GpsTracking::insert($points);
        }
    }
}
