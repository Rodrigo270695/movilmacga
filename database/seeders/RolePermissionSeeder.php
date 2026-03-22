<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

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

            // Gestión de businesses (negocios)
            'gestor-business-acceso',
            'gestor-business-ver',
            'gestor-business-crear',
            'gestor-business-editar',
            'gestor-business-eliminar',
            'gestor-business-cambiar-estado',

            // Gestión de Usuario-Negocio
            'gestor-business-user-acceso',
            'gestor-business-user-ver',
            'gestor-business-user-asignar',
            'gestor-business-user-desasignar',

            // Gestión de usuarios (futuro módulo)
            'gestor-usuarios-acceso',
            'gestor-usuarios-ver',
            'gestor-usuarios-crear',
            'gestor-usuarios-editar',
            'gestor-usuarios-eliminar',
            'gestor-usuarios-cambiar-estado',

            // Gestión de formularios dinámicos
            'gestor-formularios-acceso',
            'gestor-formularios-ver',
            'gestor-formularios-crear',
            'gestor-formularios-editar',
            'gestor-formularios-eliminar',
            'gestor-formularios-cambiar-estado',
            'gestor-formularios-gestionar-secciones',
            'gestor-formularios-gestionar-campos',

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
            'gestor-ruta-fechas-visita',

            // Gestión de PDVs (DCS)
            'gestor-pdv-acceso',
            'gestor-pdv-ver',
            'gestor-pdv-crear',
            'gestor-pdv-editar',
            'gestor-pdv-eliminar',
            'gestor-pdv-cambiar-estado',

            // Gestión de Supervisor-Zonal (DCS)
            'gestor-zonal-supervisor-acceso',
            'gestor-zonal-supervisor-ver',
            'gestor-zonal-supervisor-asignar',
            'gestor-zonal-supervisor-desasignar',

            // Gestión de Vendedor-Circuito (para Supervisores)
            'gestor-vendedor-circuito-acceso',
            'gestor-vendedor-circuito-ver',
            'gestor-vendedor-circuito-asignar',
            'gestor-vendedor-circuito-desasignar',

            // Gestión de Aprobaciones PDV (DCS)
            'gestor-pdv-aprobaciones-acceso',
            'gestor-pdv-aprobaciones-ver',
            'gestor-pdv-aprobaciones-aprobar',
            'gestor-pdv-aprobaciones-rechazar',

            // Mapas y Tracking GPS
            'menu-mapas',
            'mapa-rastreo-vendedores-acceso',
            'mapa-rastreo-vendedores-ver',
            'mapa-rastreo-vendedores-tiempo-real',
            'mapa-rastreo-vendedores-historial',

            // Reportes
            'menu-reportes',
            'reporte-pdvs-visitados-acceso',
            'reporte-pdvs-visitados-ver',
            'reporte-pdvs-visitados-exportar',

            // NUEVOS PERMISOS PARA REPORTE DE JORNADAS LABORALES
            'reporte-jornadas-laborales-acceso',
            'reporte-jornadas-laborales-ver',
            'reporte-jornadas-laborales-exportar',

            'reporte-tipo-negocio-acceso',
            'reporte-tipo-negocio-ver',

            // Aplicación Móvil (Supervisores/Vendedores)
            'app-movil-acceso',
            'app-movil-gps-tracking',
            'app-movil-pdv-visitas',
            'app-movil-reportes',

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

        // Crear rol supervisor (acceso web + app móvil)
        $supervisorRole = Role::firstOrCreate(['name' => 'Supervisor']);

        // Crear rol vendedor (solo app móvil)
        $vendedorRole = Role::firstOrCreate(['name' => 'Vendedor']);

        // Asignar todos los permisos al administrador (sincronizar para asegurar que tenga todos)
        $adminRole->syncPermissions(Permission::all());

        // Asignar permisos al supervisor (acceso web + app móvil)
        $supervisorPermissions = [
            // Acceso básico a la web
            'menu-dashboard',
            'ver-dashboard',
            'ver-estadisticas',
            'menu-dcs',

            // Gestión de rutas (incluyendo fechas de visita)
            'gestor-ruta-acceso',
            'gestor-ruta-ver',
            'gestor-ruta-fechas-visita',

            // Módulos específicos para supervisores
            'gestor-zonal-supervisor-acceso',
            'gestor-zonal-supervisor-ver',
            'gestor-zonal-supervisor-asignar',
            'gestor-zonal-supervisor-desasignar',

            // Gestión de vendedores en sus circuitos
            'gestor-vendedor-circuito-acceso',
            'gestor-vendedor-circuito-ver',
            'gestor-vendedor-circuito-asignar',
            'gestor-vendedor-circuito-desasignar',

            // Aprobaciones de cambios PDV
            'gestor-pdv-aprobaciones-acceso',
            'gestor-pdv-aprobaciones-ver',
            'gestor-pdv-aprobaciones-aprobar',
            'gestor-pdv-aprobaciones-rechazar',

            // Mapas y tracking
            'mapa-rastreo-vendedores-acceso',
            'mapa-rastreo-vendedores-ver',
            'mapa-rastreo-vendedores-tiempo-real',
            'mapa-rastreo-vendedores-historial',

            // App móvil
            'app-movil-acceso',
            'app-movil-gps-tracking',
            'app-movil-pdv-visitas',
            'app-movil-reportes',

            // Reportes
            'menu-reportes',
            'reporte-pdvs-visitados-acceso',
            'reporte-pdvs-visitados-ver',
            'reporte-pdvs-visitados-exportar',
        ];
        $supervisorRole->syncPermissions($supervisorPermissions);

        // Asignar permisos al vendedor (solo app móvil)
        $vendedorPermissions = [
            'app-movil-acceso',
            'app-movil-gps-tracking',
            'app-movil-pdv-visitas',
            'app-movil-reportes',
        ];
        $vendedorRole->syncPermissions($vendedorPermissions);

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
        if (! $adminUser->hasRole('Administrador')) {
            $adminUser->assignRole('Administrador');
        }

        $this->command->info('🎉 ¡Sistema de permisos configurado exitosamente!');
        $this->command->info('📋 Permisos totales creados: '.Permission::count());
        $this->command->info('');
        $this->command->info('🆕 NUEVOS PERMISOS AGREGADOS:');
        $this->command->info('   • reporte-jornadas-laborales-acceso');
        $this->command->info('   • reporte-jornadas-laborales-ver');
        $this->command->info('   • reporte-jornadas-laborales-exportar');
        $this->command->info('   📊 Para el reporte de jornadas laborales (solo Administrador)');
        $this->command->info('');
        $this->command->info('   • gestor-pdv-aprobaciones-acceso');
        $this->command->info('   • gestor-pdv-aprobaciones-ver');
        $this->command->info('   • gestor-pdv-aprobaciones-aprobar');
        $this->command->info('   • gestor-pdv-aprobaciones-rechazar');
        $this->command->info('   ✅ Para aprobaciones de cambios PDV (Administrador y Supervisor)');
        $this->command->info('');
        $this->command->info('👑 Roles creados:');
        $this->command->info('   - Administrador (acceso completo al sistema)');
        $this->command->info('   - Supervisor (acceso web + app móvil)');
        $this->command->info('   - Vendedor (solo app móvil - visita PDVs)');
        $this->command->info('👤 Usuario admin: admin@movilmacga.com / password123');
        $this->command->info('');
        $this->command->info('📁 Estructura de permisos por módulos:');
        $this->command->info('   🏠 Dashboard: menu-dashboard, ver-dashboard, ver-estadisticas');
        $this->command->info('   ⚙️  Admin: menu-admin');
        $this->command->info('   👥 Gestor Roles: gestor-roles-* (7 permisos)');
        $this->command->info('   🏢 Gestor Negocios: gestor-business-* (6 permisos)');
        $this->command->info('   👥 Gestor Usuario-Negocio: gestor-business-user-* (4 permisos)');
        $this->command->info('   👤 Gestor Usuarios: gestor-usuarios-* (6 permisos)');
        $this->command->info('   📝 Gestor Formularios: gestor-formularios-* (8 permisos)');
        $this->command->info('   📁 Gestor Zonales: gestor-zonal-* (6 permisos)');
        $this->command->info('   🔌 Gestor Circuitos: gestor-circuito-* (6 permisos)');
        $this->command->info('   🛤️ Gestor Rutas: gestor-ruta-* (7 permisos)');
        $this->command->info('   📍 Gestor PDVs: gestor-pdv-* (6 permisos)');
        $this->command->info('   👨‍💼 Supervisor-Zonal: gestor-zonal-supervisor-* (4 permisos)');
        $this->command->info('   🔄 Vendedor-Circuito: gestor-vendedor-circuito-* (4 permisos)');
        $this->command->info('   ✅ Aprobaciones PDV: gestor-pdv-aprobaciones-* (4 permisos)');
        $this->command->info('   🗺️ Mapas: mapa-rastreo-vendedores-* (4 permisos)');
        $this->command->info('   📊 Reportes: reporte-* (4 permisos)');
        $this->command->info('   📱 App Móvil: app-movil-* (4 permisos)');
        $this->command->info('   🔧 Configuración: configuracion-* (3 permisos)');
        $this->command->info('');
        $this->command->info('💡 Los menús se mostrarán automáticamente según los permisos del usuario');
        $this->command->info('🔒 Roles protegidos: Administrador, Supervisor y Vendedor no se pueden eliminar');

        // Ejecutar seeders de empresas y zonales
        // $this->call([
        //    BusinessZonalSeeder::class,
        // ]);
    }
}
