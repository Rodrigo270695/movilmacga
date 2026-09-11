<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PdvFrecuenciaVisitasPermissionSeeder extends Seeder
{
    /**
     * Uso: php artisan db:seed --class=PdvFrecuenciaVisitasPermissionSeeder
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'reporte-frecuencia-visitas-pdv-acceso',
            'reporte-frecuencia-visitas-pdv-ver',
            'reporte-frecuencia-visitas-pdv-exportar',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        foreach (['Administrador', 'Supervisor'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if (! $role) {
                continue;
            }

            foreach ($permissions as $name) {
                $role->givePermissionTo($name);
            }

            foreach (User::role($roleName)->get() as $user) {
                Cache::forget("user_permissions_roles_{$user->id}");
            }

            $this->command->info("Permisos asignados a {$roleName}: ".implode(', ', $permissions));
        }

        $this->command->info('Permisos creados/actualizados: '.implode(', ', $permissions));
    }
}
