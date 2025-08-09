<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Configuración inicial
            RolePermissionSeeder::class,

            // Datos de prueba para Perú
            PeruTrackingDataSeeder::class,

            // Asignación de usuarios a negocios
            BusinessUserSeeder::class,

            // Otros seeders de tracking
            GpsTrackingSeeder::class,
        ]);
    }
}
