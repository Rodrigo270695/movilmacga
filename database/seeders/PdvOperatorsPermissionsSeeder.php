<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PdvOperatorsPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates only the PDV-Operadores permissions and assigns them to the
     * Administrador role. Safe to run on production.
     *
     * Usage: php artisan db:seed --class=PdvOperatorsPermissionsSeeder
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'gestor-pdv-operadores-acceso',
            'gestor-pdv-operadores-ver',
            'gestor-pdv-operadores-ver-mapa',
            'gestor-pdv-operadores-editar',
            'gestor-pdv-operadores-exportar',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $adminRole = Role::where('name', 'Administrador')->where('guard_name', 'web')->first();

        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
            $this->command->info('Permisos PDV-Operadores asignados al rol Administrador.');
        } else {
            $this->command->warn('Rol "Administrador" no encontrado.');
        }

        // Invalidar caché de permisos para que el frontend reciba los nuevos en la próxima carga
        \Illuminate\Support\Facades\Cache::flush();
        $this->command->info('Caché limpiada. Recarga la página (F5) para ver el botón Mapa.');

        $this->command->info('Permisos creados: ' . implode(', ', $permissions));
        $this->command->info('Ejecutar en producción: php artisan db:seed --class=PdvOperatorsPermissionsSeeder');
    }
}
