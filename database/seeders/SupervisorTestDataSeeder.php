<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Business;
use App\Models\Zonal;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class SupervisorTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Creando datos de prueba para el sistema de supervisores zonales...');

        // Obtener rol Supervisor (ya creado en RolePermissionSeeder)
        $supervisorRole = Role::where('name', 'Supervisor')->first();

        if (!$supervisorRole) {
            $this->command->error('❌ El rol "Supervisor" no existe. Ejecuta primero el RolePermissionSeeder.');
            return;
        }

        // Crear businesses de prueba
        $businesses = [
            ['name' => 'LOTO', 'status' => true],
            ['name' => 'MACGA', 'status' => true],
        ];

        foreach ($businesses as $businessData) {
            Business::firstOrCreate(
                ['name' => $businessData['name']],
                $businessData
            );
            $this->command->info("✅ Business creado/actualizado: {$businessData['name']}");
        }

        // Crear zonales de prueba para cada business
        $zonales = [
            // Zonales para LOTO
            ['name' => 'Zonal Lima Norte', 'business' => 'LOTO'],
            ['name' => 'Zonal Lima Sur', 'business' => 'LOTO'],
            ['name' => 'Zonal Lima Este', 'business' => 'LOTO'],
            ['name' => 'Zonal Lima Centro', 'business' => 'LOTO'],
            ['name' => 'Zonal Callao', 'business' => 'LOTO'],
            ['name' => 'Zonal Comas', 'business' => 'LOTO'],

            // Zonales para MACGA
            ['name' => 'Zonal Amazonas', 'business' => 'MACGA'],
            ['name' => 'Zonal Loreto', 'business' => 'MACGA'],
            ['name' => 'Zonal Ucayali', 'business' => 'MACGA'],
            ['name' => 'Zonal San Martín', 'business' => 'MACGA'],
            ['name' => 'Zonal Madre de Dios', 'business' => 'MACGA'],
            ['name' => 'Zonal Huánuco', 'business' => 'MACGA'],
        ];

        foreach ($zonales as $zonalData) {
            $business = Business::where('name', $zonalData['business'])->first();
            if ($business) {
                Zonal::firstOrCreate(
                    ['name' => $zonalData['name']],
                    [
                        'business_id' => $business->id,
                        'status' => true,
                    ]
                );
                $this->command->info("✅ Zonal creado/actualizado: {$zonalData['name']} ({$zonalData['business']})");
            }
        }

        // Crear supervisores de prueba
        $supervisores = [
            [
                'first_name' => 'Carlos',
                'last_name' => 'González',
                'email' => 'carlos.gonzalez@movilmacga.com',
                'dni' => '72345678',
                'username' => 'carlos.gonzalez',
                'phone_number' => '+51 987654321',
            ],
            [
                'first_name' => 'María',
                'last_name' => 'Rodríguez',
                'email' => 'maria.rodriguez@movilmacga.com',
                'dni' => '72345679',
                'username' => 'maria.rodriguez',
                'phone_number' => '+51 987654322',
            ],
            [
                'first_name' => 'José',
                'last_name' => 'López',
                'email' => 'jose.lopez@movilmacga.com',
                'dni' => '72345680',
                'username' => 'jose.lopez',
                'phone_number' => '+51 987654323',
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'Martínez',
                'email' => 'ana.martinez@movilmacga.com',
                'dni' => '72345681',
                'username' => 'ana.martinez',
                'phone_number' => '+51 987654324',
            ],
            [
                'first_name' => 'Roberto',
                'last_name' => 'Silva',
                'email' => 'roberto.silva@movilmacga.com',
                'dni' => '72345682',
                'username' => 'roberto.silva',
                'phone_number' => '+51 987654325',
            ],
        ];

        foreach ($supervisores as $supervisorData) {
            $user = User::firstOrCreate(
                ['email' => $supervisorData['email']],
                [
                    'name' => $supervisorData['first_name'] . ' ' . $supervisorData['last_name'],
                    'dni' => $supervisorData['dni'],
                    'first_name' => $supervisorData['first_name'],
                    'last_name' => $supervisorData['last_name'],
                    'username' => $supervisorData['username'],
                    'phone_number' => $supervisorData['phone_number'],
                    'status' => true,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );

            // Asignar rol supervisor
            if (!$user->hasRole('Supervisor')) {
                $user->assignRole('Supervisor');
            }

            $this->command->info("✅ Supervisor creado: {$user->first_name} {$user->last_name}");
        }

        $this->command->info('');
        $this->command->info('🎉 ¡Datos de prueba creados exitosamente!');
        $this->command->info('📊 Resumen:');
        $this->command->info('   - ' . Business::count() . ' businesses');
        $this->command->info('   - ' . Zonal::count() . ' zonales');
        $this->command->info('   - ' . User::role('Supervisor')->count() . ' supervisores');
        $this->command->info('');
        $this->command->info('🔑 Credenciales de supervisores:');
        $this->command->info('   Email: [cualquier supervisor]@movilmacga.com');
        $this->command->info('   Password: password123');
        $this->command->info('');
        $this->command->info('💡 Ahora puedes probar el módulo de asignación de supervisores a zonales.');
    }
}
