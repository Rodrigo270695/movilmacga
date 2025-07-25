<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('paises')->insert([
            'id' => 1,
            'name' => 'Perú',
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
