<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class NegocioOperadorPermissionSeeder extends Seeder
{
    /**
     * Crea permisos de Negocio - Operador y del reporte "Tipo de negocio" (Reportes) y los asigna al Administrador.
     *
     * Uso: php artisan db:seed --class=NegocioOperadorPermissionSeeder
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'gestor-negocio-operador-ver',
            // Reporte en menú Reportes → Tipo de negocio (acceso al ítem + ver contenido)
            'reporte-tipo-negocio-acceso',
            'reporte-tipo-negocio-ver',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $adminRole = Role::where('name', 'Administrador')->where('guard_name', 'web')->first();

        if ($adminRole) {
            foreach ($permissions as $name) {
                $adminRole->givePermissionTo($name);
            }

            // Misma clave que HandleInertiaRequests: si no se invalida, el sidebar sigue sin el permiso ~5 min
            foreach (User::role('Administrador')->get() as $user) {
                Cache::forget("user_permissions_roles_{$user->id}");
            }

            $this->command->info('Permisos asignados al rol Administrador: '.implode(', ', $permissions));
        } else {
            $this->command->warn('Rol "Administrador" no encontrado. Crea el rol y vuelve a ejecutar el seeder.');
        }

        $this->command->info('Permisos creados/actualizados: '.implode(', ', $permissions));
    }
}
