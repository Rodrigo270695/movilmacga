<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusinessUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🏢 Asignando usuarios a negocios...');

        // Obtener todos los negocios y usuarios
        $businesses = Business::all();
        $users = User::where('status', true)->get();

        if ($businesses->isEmpty()) {
            $this->command->warn('No hay negocios disponibles para asignar usuarios.');
            return;
        }

        if ($users->isEmpty()) {
            $this->command->warn('No hay usuarios activos disponibles para asignar.');
            return;
        }

        // Asignar usuarios a negocios
        foreach ($users as $user) {
            // Cada usuario puede pertenecer a múltiples negocios
            $userBusinesses = $businesses->random(rand(1, min(3, $businesses->count())));

            foreach ($userBusinesses as $business) {
                // Verificar si ya existe la asignación
                if (!$user->businesses()->where('business_id', $business->id)->exists()) {
                    $user->businesses()->attach($business->id, [
                        'is_active' => true,
                        'assigned_at' => now(),
                        'notes' => 'Asignación automática desde seeder',
                        'assignment_data' => json_encode([
                            'assigned_by' => 'seeder',
                            'reason' => 'initial_assignment'
                        ])
                    ]);

                    $this->command->info("✓ Usuario {$user->first_name} {$user->last_name} asignado a {$business->name}");
                }
            }
        }

        // Mostrar estadísticas
        $totalAssignments = DB::table('business_user')->count();
        $this->command->info("✅ Total de asignaciones creadas: {$totalAssignments}");

        // Mostrar usuarios por negocio
        foreach ($businesses as $business) {
            $userCount = $business->activeUsers()->count();
            $this->command->info("📊 {$business->name}: {$userCount} usuarios activos");
        }
    }
}
