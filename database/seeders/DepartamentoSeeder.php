<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartamentoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departamentos = [
            ['id' => 1, 'pais_id' => 1, 'name' => 'Amazonas'],
            ['id' => 2, 'pais_id' => 1, 'name' => 'Áncash'],
            ['id' => 3, 'pais_id' => 1, 'name' => 'Apurímac'],
            ['id' => 4, 'pais_id' => 1, 'name' => 'Arequipa'],
            ['id' => 5, 'pais_id' => 1, 'name' => 'Ayacucho'],
            ['id' => 6, 'pais_id' => 1, 'name' => 'Cajamarca'],
            ['id' => 7, 'pais_id' => 1, 'name' => 'Callao'],
            ['id' => 8, 'pais_id' => 1, 'name' => 'Cusco'],
            ['id' => 9, 'pais_id' => 1, 'name' => 'Huancavelica'],
            ['id' => 10, 'pais_id' => 1, 'name' => 'Huánuco'],
            ['id' => 11, 'pais_id' => 1, 'name' => 'Ica'],
            ['id' => 12, 'pais_id' => 1, 'name' => 'Junín'],
            ['id' => 13, 'pais_id' => 1, 'name' => 'La Libertad'],
            ['id' => 14, 'pais_id' => 1, 'name' => 'Lambayeque'],
            ['id' => 15, 'pais_id' => 1, 'name' => 'Lima'],
            ['id' => 16, 'pais_id' => 1, 'name' => 'Loreto'],
            ['id' => 17, 'pais_id' => 1, 'name' => 'Madre de Dios'],
            ['id' => 18, 'pais_id' => 1, 'name' => 'Moquegua'],
            ['id' => 19, 'pais_id' => 1, 'name' => 'Pasco'],
            ['id' => 20, 'pais_id' => 1, 'name' => 'Piura'],
            ['id' => 21, 'pais_id' => 1, 'name' => 'Puno'],
            ['id' => 22, 'pais_id' => 1, 'name' => 'San Martín'],
            ['id' => 23, 'pais_id' => 1, 'name' => 'Tacna'],
            ['id' => 24, 'pais_id' => 1, 'name' => 'Tumbes'],
            ['id' => 25, 'pais_id' => 1, 'name' => 'Ucayali'],
        ];

        foreach ($departamentos as $departamento) {
            DB::table('departamentos')->insert([
                'id' => $departamento['id'],
                'pais_id' => $departamento['pais_id'],
                'name' => $departamento['name'],
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
