<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Zonal;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ZonalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener las empresas
        $macga = Business::where('name', 'MACGA')->first();
        $loto = Business::where('name', 'LOTO')->first();

        if (!$macga || !$loto) {
            $this->command->error('❌ Error: Primero ejecuta BusinessSeeder para crear las empresas');
            return;
        }

        // 24 departamentos del Perú
        $departamentos = [
            // Primeros 12 para MACGA
            'Amazonas',
            'Áncash',
            'Apurímac',
            'Arequipa',
            'Ayacucho',
            'Cajamarca',
            'Callao',
            'Cusco',
            'Huancavelica',
            'Huánuco',
            'Ica',
            'Junín',

            // Siguientes 12 para LOTO
            'La Libertad',
            'Lambayeque',
            'Lima',
            'Loreto',
            'Madre de Dios',
            'Moquegua',
            'Pasco',
            'Piura',
            'Puno',
            'San Martín',
            'Tacna',
            'Tumbes',
        ];

        foreach ($departamentos as $index => $departamento) {
            // Primeros 12 departamentos para MACGA, siguientes 12 para LOTO
            $businessId = $index < 12 ? $macga->id : $loto->id;
            $businessName = $index < 12 ? 'MACGA' : 'LOTO';

            $zonal = Zonal::firstOrCreate(
                ['name' => "Zonal {$departamento}"],
                [
                    'business_id' => $businessId,
                    'status' => true,
                ]
            );

            $this->command->info("✅ Zonal {$departamento} → {$businessName}");
        }

        $zonalesMacga = Zonal::where('business_id', $macga->id)->count();
        $zonalesLoto = Zonal::where('business_id', $loto->id)->count();

        $this->command->info('');
        $this->command->info('🎯 ¡Zonales creados exitosamente!');
        $this->command->info('📊 Resumen de asignaciones:');
        $this->command->info("   🔹 MACGA: {$zonalesMacga} zonales");
        $this->command->info("   🔹 LOTO: {$zonalesLoto} zonales");
        $this->command->info('   📍 Total zonales: ' . Zonal::count());
        $this->command->info('');
        $this->command->info('📋 Zonales por empresa:');

        // Mostrar zonales de MACGA
        $this->command->info('🔸 MACGA:');
        Zonal::where('business_id', $macga->id)->get()->each(function($zonal) {
            $this->command->info("   • {$zonal->name}");
        });

        // Mostrar zonales de LOTO
        $this->command->info('🔸 LOTO:');
        Zonal::where('business_id', $loto->id)->get()->each(function($zonal) {
            $this->command->info("   • {$zonal->name}");
        });
    }
}
