<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class OperatorPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates only the operator-related permissions and assigns them to the
     * Administrador role. Safe to run on production: does not touch existing
     * permissions or other roles.
     *
     * Usage: php artisan db:seed --class=OperatorPermissionsSeeder
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'gestor-operador-acceso',
            'gestor-operador-ver',
            'gestor-operador-crear',
            'gestor-operador-editar',
            'gestor-operador-eliminar',
            'gestor-operador-cambiar-estado',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $adminRole = Role::where('name', 'Administrador')->where('guard_name', 'web')->first();

        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
            $this->command->info('Permisos de operadores asignados al rol Administrador.');
        } else {
            $this->command->warn('Rol "Administrador" no encontrado. Crea el rol y vuelve a ejecutar el seeder.');
        }

        $this->command->info('Permisos de operadores creados: ' . implode(', ', $permissions));
        $this->command->info('Ejecuta solo este seeder en producción: php artisan db:seed --class=OperatorPermissionsSeeder');
    }
}
