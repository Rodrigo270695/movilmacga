<?php

namespace Database\Seeders;

use App\Models\Business;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BusinessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businesses = [
            [
                'name' => 'MACGA',
                'status' => true,
            ],
            [
                'name' => 'LOTO',
                'status' => true,
            ],
        ];

        foreach ($businesses as $business) {
            Business::firstOrCreate(
                ['name' => $business['name']],
                $business
            );
        }

        $this->command->info('🏢 ¡Empresas creadas exitosamente!');
        $this->command->info('   📊 Total empresas: ' . Business::count());
        $this->command->info('   🔹 MACGA - Empresa de telecomunicaciones');
        $this->command->info('   🔹 LOTO - Empresa de telecomunicaciones');
    }
}
