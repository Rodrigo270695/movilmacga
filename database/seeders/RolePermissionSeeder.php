<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar cache de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos básicos
        $permissions = [
            // Usuarios
            'ver-usuarios',
            'crear-usuarios',
            'editar-usuarios',
            'eliminar-usuarios',

            // Roles y permisos
            'ver-roles',
            'crear-roles',
            'editar-roles',
            'eliminar-roles',
            'asignar-permisos',

            // Dashboard
            'ver-dashboard',
            'ver-estadisticas',

            // Configuración
            'ver-configuracion',
            'editar-configuracion',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

                // Crear rol administrador inicial
        $adminRole = Role::create(['name' => 'Administrador']);

        // Asignar todos los permisos al administrador
        $adminRole->givePermissionTo(Permission::all());

        // Crear usuario administrador por defecto
        $adminUser = User::create([
            'name' => 'Administrador',
            'dni' => '12345678',
            'first_name' => 'Admin',
            'last_name' => 'Sistema',
            'username' => 'admin',
            'phone_number' => null,
            'status' => true,
            'email' => 'admin@movilmacga.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $adminUser->assignRole('Administrador');

        $this->command->info('¡Sistema de permisos configurado exitosamente!');
        $this->command->info('📋 Permisos disponibles: ' . Permission::count());
        $this->command->info('👑 Rol creado: Administrador (con todos los permisos)');
        $this->command->info('👤 Usuario administrador: admin@movilmacga.com / password123');
        $this->command->info('💡 Ahora puedes crear nuevos roles desde la interfaz web y asignar permisos específicos');
    }
}
