<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Business;
use App\Models\Zonal;
use App\Models\Circuit;
use App\Models\UserCircuit;
use Spatie\Permission\Models\Role;

class VendorCircuitTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Iniciando creación de datos de prueba para Vendedor-Circuito...');

        // Verificar que existen roles y negocios
        $vendorRole = Role::where('name', 'Vendedor')->first();
        if (!$vendorRole) {
            $this->command->error('❌ No existe el rol "Vendedor". Ejecuta primero RolePermissionSeeder.');
            return;
        }

        $businesses = Business::where('status', true)->get();
        if ($businesses->isEmpty()) {
            $this->command->error('❌ No existen negocios activos. Ejecuta primero BusinessZonalSeeder.');
            return;
        }

        // 1. Crear vendedores de prueba
        $this->createVendors($vendorRole);

        // 2. Crear circuitos de prueba
        $this->createCircuits();

        // 3. Crear algunas asignaciones de prueba
        $this->createAssignments();

        $this->command->info('');
        $this->command->info('✅ ¡Datos de prueba creados exitosamente!');
        $this->showSummary();
    }

    private function createVendors($vendorRole)
    {
        $this->command->info('👥 Creando vendedores de prueba...');

        $vendors = [
            [
                'first_name' => 'Carlos',
                'last_name' => 'García Mendoza',
                'email' => 'carlos.garcia@movilmacga.com',
                'dni' => '72345678',
                'username' => 'cgarcia',
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'López Rivera',
                'email' => 'ana.lopez@movilmacga.com',
                'dni' => '73456789',
                'username' => 'alopez',
            ],
            [
                'first_name' => 'Miguel',
                'last_name' => 'Rodríguez Silva',
                'email' => 'miguel.rodriguez@movilmacga.com',
                'dni' => '74567890',
                'username' => 'mrodriguez',
            ],
            [
                'first_name' => 'Patricia',
                'last_name' => 'Fernández Torres',
                'email' => 'patricia.fernandez@movilmacga.com',
                'dni' => '75678901',
                'username' => 'pfernandez',
            ],
            [
                'first_name' => 'José',
                'last_name' => 'Martínez Cruz',
                'email' => 'jose.martinez@movilmacga.com',
                'dni' => '76789012',
                'username' => 'jmartinez',
            ],
            [
                'first_name' => 'María',
                'last_name' => 'Sánchez Ruiz',
                'email' => 'maria.sanchez@movilmacga.com',
                'dni' => '77890123',
                'username' => 'msanchez',
            ],
            [
                'first_name' => 'Luis',
                'last_name' => 'Pérez Morales',
                'email' => 'luis.perez@movilmacga.com',
                'dni' => '78901234',
                'username' => 'lperez',
            ],
            [
                'first_name' => 'Carmen',
                'last_name' => 'González Vega',
                'email' => 'carmen.gonzalez@movilmacga.com',
                'dni' => '79012345',
                'username' => 'cgonzalez',
            ],
        ];

        foreach ($vendors as $vendorData) {
            // Verificar si el usuario ya existe por email
            $user = User::where('email', $vendorData['email'])->first();
            
            if (!$user) {
                // Generar DNI único
                do {
                    $dni = $vendorData['dni'];
                    $existingDni = User::where('dni', $dni)->first();
                    if ($existingDni) {
                        $dni = '7' . rand(1000000, 9999999); // Generar uno nuevo
                    }
                } while ($existingDni);

                // Generar username único
                $username = $vendorData['username'];
                $counter = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $vendorData['username'] . $counter;
                    $counter++;
                }

                $user = User::create([
                    'email' => $vendorData['email'],
                    'name' => $vendorData['first_name'] . ' ' . $vendorData['last_name'],
                    'first_name' => $vendorData['first_name'],
                    'last_name' => $vendorData['last_name'],
                    'dni' => $dni,
                    'username' => $username,
                    'phone_number' => '+51 9' . rand(10000000, 99999999),
                    'status' => true,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]);
            }

            // Asignar rol de Vendedor si no lo tiene
            if (!$user->hasRole('Vendedor')) {
                $user->assignRole('Vendedor');
            }

            $this->command->info("   ✅ Vendedor: {$user->first_name} {$user->last_name}");
        }
    }

    private function createCircuits()
    {
        $this->command->info('🔌 Creando circuitos de prueba...');

        // Obtener zonales existentes
        $zonals = Zonal::where('status', true)->with('business')->get();

        if ($zonals->isEmpty()) {
            $this->command->error('❌ No hay zonales disponibles para crear circuitos.');
            return;
        }

        $circuitNames = [
            'Norte', 'Sur', 'Este', 'Oeste', 'Centro',
            'Industrial', 'Comercial', 'Residencial',
            'Urbano', 'Rural', 'Metropolitano', 'Provincial'
        ];

        $createdCircuits = 0;
        $targetCircuits = 25; // Crear 25 circuitos

        foreach ($zonals as $zonal) {
            if ($createdCircuits >= $targetCircuits) break;

            // Crear 1-3 circuitos por zonal
            $circuitsForZonal = rand(1, 3);

            for ($i = 0; $i < $circuitsForZonal && $createdCircuits < $targetCircuits; $i++) {
                $circuitName = $circuitNames[array_rand($circuitNames)];
                $fullName = "Circuito {$circuitName} - {$zonal->name}";
                $code = 'CIR-' . strtoupper(substr($zonal->business->name, 0, 3)) . '-' . 
                       strtoupper(substr($zonal->name, -3)) . '-' . str_pad($createdCircuits + 1, 3, '0', STR_PAD_LEFT);

                $circuit = Circuit::firstOrCreate(
                    [
                        'code' => $code,
                        'zonal_id' => $zonal->id
                    ],
                    [
                        'name' => $fullName,
                        'status' => true,
                        'description' => "Circuito de {$circuitName} para el zonal {$zonal->name} de {$zonal->business->name}",
                        'priority' => rand(1, 5),
                        'estimated_time' => rand(2, 8) * 60, // 2-8 horas en minutos
                        'circuit_data' => json_encode([
                            'type' => $circuitName,
                            'zone_type' => rand(0, 1) ? 'urban' : 'rural',
                            'difficulty' => rand(1, 5)
                        ])
                    ]
                );

                $this->command->info("   ✅ {$circuit->name} ({$circuit->code}) - {$zonal->business->name}");
                $createdCircuits++;
            }
        }
    }

    private function createAssignments()
    {
        $this->command->info('🔗 Creando asignaciones de prueba...');

        $vendors = User::role('Vendedor')->where('status', true)->get();
        $circuits = Circuit::where('status', true)->get();

        if ($vendors->isEmpty() || $circuits->isEmpty()) {
            $this->command->warn('⚠️ No hay vendedores o circuitos disponibles para crear asignaciones.');
            return;
        }

        // Asignar aproximadamente el 60% de los circuitos
        $circuitsToAssign = $circuits->take(ceil($circuits->count() * 0.6));

        foreach ($circuitsToAssign as $circuit) {
            $vendor = $vendors->random();

            // Verificar que el vendedor no tenga ya una asignación activa
            $existingAssignment = UserCircuit::where('user_id', $vendor->id)
                ->where('is_active', true)
                ->first();

            if (!$existingAssignment) {
                UserCircuit::create([
                    'user_id' => $vendor->id,
                    'circuit_id' => $circuit->id,
                    'assigned_date' => now()->subDays(rand(1, 30)),
                    'is_active' => true,
                    'priority' => rand(1, 5),
                    'notes' => $this->getRandomNote(),
                    'valid_from' => now()->subDays(rand(1, 30)),
                    'assignment_data' => json_encode([
                        'assigned_by' => 'System Test',
                        'assignment_reason' => 'Datos de prueba'
                    ])
                ]);

                $this->command->info("   ✅ {$vendor->first_name} {$vendor->last_name} → {$circuit->name}");
            }
        }
    }

    private function getRandomNote(): ?string
    {
        $notes = [
            'Vendedor experimentado en la zona',
            'Conoce bien el territorio asignado',
            'Especializado en este tipo de circuito',
            'Asignación temporal por cobertura',
            'Vendedor con buen rendimiento histórico',
            null, // Sin observaciones
            null,
            'Requiere apoyo inicial en la zona',
            'Asignación por disponibilidad',
        ];

        return $notes[array_rand($notes)];
    }

    private function showSummary()
    {
        $vendorCount = User::role('Vendedor')->where('status', true)->count();
        $circuitCount = Circuit::where('status', true)->count();
        $assignmentCount = UserCircuit::where('is_active', true)->count();
        $unassignedCircuits = $circuitCount - $assignmentCount;

        $this->command->info('📊 Resumen de datos creados:');
        $this->command->info("   👥 Vendedores activos: {$vendorCount}");
        $this->command->info("   🔌 Circuitos disponibles: {$circuitCount}");
        $this->command->info("   🔗 Asignaciones activas: {$assignmentCount}");
        $this->command->info("   📍 Circuitos sin asignar: {$unassignedCircuits}");
        $this->command->info('');
        $this->command->info('🎯 ¡Datos de prueba listos para usar!');
        $this->command->info('📧 Puedes usar cualquier vendedor con password: password123');
    }
}