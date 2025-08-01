<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BusinessZonalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ejecutar los seeders en orden
        $this->call([
            BusinessSeeder::class,
            ZonalSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('🎉 ¡Sistema de empresas y zonales completado!');
        $this->command->info('💼 Empresas: MACGA y LOTO');
        $this->command->info('🗺️ Zonales: 24 (basados en departamentos del Perú)');
        $this->command->info('📊 Distribución: 12 zonales por empresa');
    }
}
