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

        // Crear permisos organizados por funcionalidades
        $permissions = [
            // Acceso a menús principales
            'menu-dashboard',
            'menu-admin',
            'menu-dcs',

            // Dashboard
            'ver-dashboard',
            'ver-estadisticas',

            // Gestión de roles (módulo actual)
            'gestor-roles-acceso',
            'gestor-roles-ver',
            'gestor-roles-crear',
            'gestor-roles-editar',
            'gestor-roles-eliminar',
            'gestor-roles-cambiar-estado',
            'gestor-roles-asignar-permisos',

            // Gestión de usuarios (futuro módulo)
            'gestor-usuarios-acceso',
            'gestor-usuarios-ver',
            'gestor-usuarios-crear',
            'gestor-usuarios-editar',
            'gestor-usuarios-eliminar',
            'gestor-usuarios-cambiar-estado',

            // Gestión de zonales (DCS)
            'gestor-zonal-acceso',
            'gestor-zonal-ver',
            'gestor-zonal-crear',
            'gestor-zonal-editar',
            'gestor-zonal-eliminar',
            'gestor-zonal-cambiar-estado',

            // Gestión de circuitos (DCS)
            'gestor-circuito-acceso',
            'gestor-circuito-ver',
            'gestor-circuito-crear',
            'gestor-circuito-editar',
            'gestor-circuito-eliminar',
            'gestor-circuito-cambiar-estado',

            // Gestión de rutas (DCS)
            'gestor-ruta-acceso',
            'gestor-ruta-ver',
            'gestor-ruta-crear',
            'gestor-ruta-editar',
            'gestor-ruta-eliminar',
            'gestor-ruta-cambiar-estado',

            // Configuración del sistema (futuro)
            'configuracion-acceso',
            'configuracion-general',
            'configuracion-seguridad',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Crear rol administrador inicial
        $adminRole = Role::firstOrCreate(['name' => 'Administrador']);

        // Asignar todos los permisos al administrador (sincronizar para asegurar que tenga todos)
        $adminRole->syncPermissions(Permission::all());

        // Crear usuario administrador por defecto
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@movilmacga.com'],
            [
                'name' => 'Administrador',
                'dni' => '12345678',
                'first_name' => 'Admin',
                'last_name' => 'Sistema',
                'username' => 'admin',
                'phone_number' => null,
                'status' => true,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        // Solo asignar rol si no lo tiene ya
        if (!$adminUser->hasRole('Administrador')) {
            $adminUser->assignRole('Administrador');
        }

        $this->command->info('🎉 ¡Sistema de permisos configurado exitosamente!');
        $this->command->info('📋 Permisos totales creados: ' . Permission::count());
        $this->command->info('👑 Rol creado: Administrador (con acceso completo)');
        $this->command->info('👤 Usuario admin: admin@movilmacga.com / password123');
        $this->command->info('');
        $this->command->info('📁 Estructura de permisos por módulos:');
        $this->command->info('   🏠 Dashboard: menu-dashboard, ver-dashboard, ver-estadisticas');
        $this->command->info('   ⚙️  Admin: menu-admin');
        $this->command->info('   👥 Gestor Roles: gestor-roles-* (7 permisos)');
        $this->command->info('   👤 Gestor Usuarios: gestor-usuarios-* (7 permisos)');
        $this->command->info('   🔧 Configuración: configuracion-* (3 permisos)');
        $this->command->info('');
        $this->command->info('💡 Los menús se mostrarán automáticamente según los permisos del usuario');
    }
}
