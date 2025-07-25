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
        // Ejecutar seeders en orden jerárquico
        $this->call([
            // Seeders de roles y permisos (existentes)
            RolePermissionSeeder::class,

            // Nuevos seeders de división territorial (orden jerárquico)
            PaisSeeder::class,
            DepartamentoSeeder::class,
            ProvinciaSeeder::class,
            DistritoSeeder::class,
            // LocalidadSeeder::class, // No incluido por solicitud del usuario
        ]);
    }
}
