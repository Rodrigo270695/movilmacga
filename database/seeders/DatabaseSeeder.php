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
            // Seeders de roles y permisos
            RolePermissionSeeder::class,
            // Datos geográficos se ingresarán directamente en la base de datos
        ]);
    }
}
