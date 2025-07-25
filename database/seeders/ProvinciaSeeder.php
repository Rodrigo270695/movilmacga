<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinciaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $provincias = [
            // AMAZONAS (7 provincias)
            ['departamento_id' => 1, 'name' => 'Chachapoyas'],
            ['departamento_id' => 1, 'name' => 'Bagua'],
            ['departamento_id' => 1, 'name' => 'Bongará'],
            ['departamento_id' => 1, 'name' => 'Condorcanqui'],
            ['departamento_id' => 1, 'name' => 'Luya'],
            ['departamento_id' => 1, 'name' => 'Rodríguez de Mendoza'],
            ['departamento_id' => 1, 'name' => 'Utcubamba'],

            // ÁNCASH (20 provincias)
            ['departamento_id' => 2, 'name' => 'Huaraz'],
            ['departamento_id' => 2, 'name' => 'Aija'],
            ['departamento_id' => 2, 'name' => 'Antonio Raymondi'],
            ['departamento_id' => 2, 'name' => 'Asunción'],
            ['departamento_id' => 2, 'name' => 'Bolognesi'],
            ['departamento_id' => 2, 'name' => 'Carhuaz'],
            ['departamento_id' => 2, 'name' => 'Carlos Fermín Fitzcarrald'],
            ['departamento_id' => 2, 'name' => 'Casma'],
            ['departamento_id' => 2, 'name' => 'Corongo'],
            ['departamento_id' => 2, 'name' => 'Huari'],
            ['departamento_id' => 2, 'name' => 'Huarmey'],
            ['departamento_id' => 2, 'name' => 'Huaylas'],
            ['departamento_id' => 2, 'name' => 'Mariscal Luzuriaga'],
            ['departamento_id' => 2, 'name' => 'Ocros'],
            ['departamento_id' => 2, 'name' => 'Pallasca'],
            ['departamento_id' => 2, 'name' => 'Pomabamba'],
            ['departamento_id' => 2, 'name' => 'Recuay'],
            ['departamento_id' => 2, 'name' => 'Santa'],
            ['departamento_id' => 2, 'name' => 'Sihuas'],
            ['departamento_id' => 2, 'name' => 'Yungay'],

            // APURÍMAC (7 provincias)
            ['departamento_id' => 3, 'name' => 'Abancay'],
            ['departamento_id' => 3, 'name' => 'Andahuaylas'],
            ['departamento_id' => 3, 'name' => 'Antabamba'],
            ['departamento_id' => 3, 'name' => 'Aymaraes'],
            ['departamento_id' => 3, 'name' => 'Cotabambas'],
            ['departamento_id' => 3, 'name' => 'Chincheros'],
            ['departamento_id' => 3, 'name' => 'Grau'],

            // AREQUIPA (8 provincias)
            ['departamento_id' => 4, 'name' => 'Arequipa'],
            ['departamento_id' => 4, 'name' => 'Camaná'],
            ['departamento_id' => 4, 'name' => 'Caravelí'],
            ['departamento_id' => 4, 'name' => 'Castilla'],
            ['departamento_id' => 4, 'name' => 'Caylloma'],
            ['departamento_id' => 4, 'name' => 'Condesuyos'],
            ['departamento_id' => 4, 'name' => 'Islay'],
            ['departamento_id' => 4, 'name' => 'La Unión'],

            // AYACUCHO (11 provincias)
            ['departamento_id' => 5, 'name' => 'Huamanga'],
            ['departamento_id' => 5, 'name' => 'Cangallo'],
            ['departamento_id' => 5, 'name' => 'Huanca Sancos'],
            ['departamento_id' => 5, 'name' => 'Huanta'],
            ['departamento_id' => 5, 'name' => 'La Mar'],
            ['departamento_id' => 5, 'name' => 'Lucanas'],
            ['departamento_id' => 5, 'name' => 'Parinacochas'],
            ['departamento_id' => 5, 'name' => 'Páucar del Sara Sara'],
            ['departamento_id' => 5, 'name' => 'Sucre'],
            ['departamento_id' => 5, 'name' => 'Víctor Fajardo'],
            ['departamento_id' => 5, 'name' => 'Vilcas Huamán'],

            // CAJAMARCA (13 provincias)
            ['departamento_id' => 6, 'name' => 'Cajamarca'],
            ['departamento_id' => 6, 'name' => 'Cajabamba'],
            ['departamento_id' => 6, 'name' => 'Celendín'],
            ['departamento_id' => 6, 'name' => 'Chota'],
            ['departamento_id' => 6, 'name' => 'Contumazá'],
            ['departamento_id' => 6, 'name' => 'Cutervo'],
            ['departamento_id' => 6, 'name' => 'Hualgayoc'],
            ['departamento_id' => 6, 'name' => 'Jaén'],
            ['departamento_id' => 6, 'name' => 'San Ignacio'],
            ['departamento_id' => 6, 'name' => 'San Marcos'],
            ['departamento_id' => 6, 'name' => 'San Miguel'],
            ['departamento_id' => 6, 'name' => 'San Pablo'],
            ['departamento_id' => 6, 'name' => 'Santa Cruz'],

            // CALLAO (1 provincia)
            ['departamento_id' => 7, 'name' => 'Callao'],

            // CUSCO (13 provincias)
            ['departamento_id' => 8, 'name' => 'Cusco'],
            ['departamento_id' => 8, 'name' => 'Acomayo'],
            ['departamento_id' => 8, 'name' => 'Anta'],
            ['departamento_id' => 8, 'name' => 'Calca'],
            ['departamento_id' => 8, 'name' => 'Canas'],
            ['departamento_id' => 8, 'name' => 'Canchis'],
            ['departamento_id' => 8, 'name' => 'Chumbivilcas'],
            ['departamento_id' => 8, 'name' => 'Espinar'],
            ['departamento_id' => 8, 'name' => 'La Convención'],
            ['departamento_id' => 8, 'name' => 'Paruro'],
            ['departamento_id' => 8, 'name' => 'Paucartambo'],
            ['departamento_id' => 8, 'name' => 'Quispicanchi'],
            ['departamento_id' => 8, 'name' => 'Urubamba'],

            // HUANCAVELICA (7 provincias)
            ['departamento_id' => 9, 'name' => 'Huancavelica'],
            ['departamento_id' => 9, 'name' => 'Acobamba'],
            ['departamento_id' => 9, 'name' => 'Angaraes'],
            ['departamento_id' => 9, 'name' => 'Castrovirreyna'],
            ['departamento_id' => 9, 'name' => 'Churcampa'],
            ['departamento_id' => 9, 'name' => 'Huaytará'],
            ['departamento_id' => 9, 'name' => 'Tayacaja'],

            // HUÁNUCO (11 provincias)
            ['departamento_id' => 10, 'name' => 'Huánuco'],
            ['departamento_id' => 10, 'name' => 'Ambo'],
            ['departamento_id' => 10, 'name' => 'Dos de Mayo'],
            ['departamento_id' => 10, 'name' => 'Huacaybamba'],
            ['departamento_id' => 10, 'name' => 'Huamalíes'],
            ['departamento_id' => 10, 'name' => 'Lauricocha'],
            ['departamento_id' => 10, 'name' => 'Leoncio Prado'],
            ['departamento_id' => 10, 'name' => 'Marañón'],
            ['departamento_id' => 10, 'name' => 'Pachitea'],
            ['departamento_id' => 10, 'name' => 'Puerto Inca'],
            ['departamento_id' => 10, 'name' => 'Yarowilca'],

            // ICA (5 provincias)
            ['departamento_id' => 11, 'name' => 'Ica'],
            ['departamento_id' => 11, 'name' => 'Chincha'],
            ['departamento_id' => 11, 'name' => 'Nazca'],
            ['departamento_id' => 11, 'name' => 'Palpa'],
            ['departamento_id' => 11, 'name' => 'Pisco'],

            // JUNÍN (9 provincias)
            ['departamento_id' => 12, 'name' => 'Huancayo'],
            ['departamento_id' => 12, 'name' => 'Chanchamayo'],
            ['departamento_id' => 12, 'name' => 'Chupaca'],
            ['departamento_id' => 12, 'name' => 'Concepción'],
            ['departamento_id' => 12, 'name' => 'Jauja'],
            ['departamento_id' => 12, 'name' => 'Junín'],
            ['departamento_id' => 12, 'name' => 'Satipo'],
            ['departamento_id' => 12, 'name' => 'Tarma'],
            ['departamento_id' => 12, 'name' => 'Yauli'],

            // LA LIBERTAD (12 provincias)
            ['departamento_id' => 13, 'name' => 'Trujillo'],
            ['departamento_id' => 13, 'name' => 'Ascope'],
            ['departamento_id' => 13, 'name' => 'Bolívar'],
            ['departamento_id' => 13, 'name' => 'Chepén'],
            ['departamento_id' => 13, 'name' => 'Gran Chimú'],
            ['departamento_id' => 13, 'name' => 'Julcán'],
            ['departamento_id' => 13, 'name' => 'Otuzco'],
            ['departamento_id' => 13, 'name' => 'Pacasmayo'],
            ['departamento_id' => 13, 'name' => 'Pataz'],
            ['departamento_id' => 13, 'name' => 'Sánchez Carrión'],
            ['departamento_id' => 13, 'name' => 'Santiago de Chuco'],
            ['departamento_id' => 13, 'name' => 'Virú'],

            // LAMBAYEQUE (3 provincias)
            ['departamento_id' => 14, 'name' => 'Chiclayo'],
            ['departamento_id' => 14, 'name' => 'Ferreñafe'],
            ['departamento_id' => 14, 'name' => 'Lambayeque'],

            // LIMA (10 provincias)
            ['departamento_id' => 15, 'name' => 'Lima'],
            ['departamento_id' => 15, 'name' => 'Barranca'],
            ['departamento_id' => 15, 'name' => 'Cajatambo'],
            ['departamento_id' => 15, 'name' => 'Canta'],
            ['departamento_id' => 15, 'name' => 'Cañete'],
            ['departamento_id' => 15, 'name' => 'Huaral'],
            ['departamento_id' => 15, 'name' => 'Huarochirí'],
            ['departamento_id' => 15, 'name' => 'Huaura'],
            ['departamento_id' => 15, 'name' => 'Oyón'],
            ['departamento_id' => 15, 'name' => 'Yauyos'],

            // LORETO (8 provincias)
            ['departamento_id' => 16, 'name' => 'Maynas'],
            ['departamento_id' => 16, 'name' => 'Alto Amazonas'],
            ['departamento_id' => 16, 'name' => 'Datem del Marañón'],
            ['departamento_id' => 16, 'name' => 'Loreto'],
            ['departamento_id' => 16, 'name' => 'Mariscal Ramón Castilla'],
            ['departamento_id' => 16, 'name' => 'Putumayo'],
            ['departamento_id' => 16, 'name' => 'Requena'],
            ['departamento_id' => 16, 'name' => 'Ucayali'],

            // MADRE DE DIOS (3 provincias)
            ['departamento_id' => 17, 'name' => 'Tambopata'],
            ['departamento_id' => 17, 'name' => 'Manú'],
            ['departamento_id' => 17, 'name' => 'Tahuamanu'],

            // MOQUEGUA (3 provincias)
            ['departamento_id' => 18, 'name' => 'Mariscal Nieto'],
            ['departamento_id' => 18, 'name' => 'General Sánchez Cerro'],
            ['departamento_id' => 18, 'name' => 'Ilo'],

            // PASCO (3 provincias)
            ['departamento_id' => 19, 'name' => 'Pasco'],
            ['departamento_id' => 19, 'name' => 'Daniel Alcides Carrión'],
            ['departamento_id' => 19, 'name' => 'Oxapampa'],

            // PIURA (8 provincias)
            ['departamento_id' => 20, 'name' => 'Piura'],
            ['departamento_id' => 20, 'name' => 'Ayabaca'],
            ['departamento_id' => 20, 'name' => 'Huancabamba'],
            ['departamento_id' => 20, 'name' => 'Morropón'],
            ['departamento_id' => 20, 'name' => 'Paita'],
            ['departamento_id' => 20, 'name' => 'Sechura'],
            ['departamento_id' => 20, 'name' => 'Sullana'],
            ['departamento_id' => 20, 'name' => 'Talara'],

            // PUNO (13 provincias)
            ['departamento_id' => 21, 'name' => 'Puno'],
            ['departamento_id' => 21, 'name' => 'Azángaro'],
            ['departamento_id' => 21, 'name' => 'Carabaya'],
            ['departamento_id' => 21, 'name' => 'Chucuito'],
            ['departamento_id' => 21, 'name' => 'El Collao'],
            ['departamento_id' => 21, 'name' => 'Huancané'],
            ['departamento_id' => 21, 'name' => 'Lampa'],
            ['departamento_id' => 21, 'name' => 'Melgar'],
            ['departamento_id' => 21, 'name' => 'Moho'],
            ['departamento_id' => 21, 'name' => 'San Antonio de Putina'],
            ['departamento_id' => 21, 'name' => 'San Román'],
            ['departamento_id' => 21, 'name' => 'Sandia'],
            ['departamento_id' => 21, 'name' => 'Yunguyo'],

            // SAN MARTÍN (10 provincias)
            ['departamento_id' => 22, 'name' => 'Moyobamba'],
            ['departamento_id' => 22, 'name' => 'Bellavista'],
            ['departamento_id' => 22, 'name' => 'El Dorado'],
            ['departamento_id' => 22, 'name' => 'Huallaga'],
            ['departamento_id' => 22, 'name' => 'Lamas'],
            ['departamento_id' => 22, 'name' => 'Mariscal Cáceres'],
            ['departamento_id' => 22, 'name' => 'Picota'],
            ['departamento_id' => 22, 'name' => 'Rioja'],
            ['departamento_id' => 22, 'name' => 'San Martín'],
            ['departamento_id' => 22, 'name' => 'Tocache'],

            // TACNA (4 provincias)
            ['departamento_id' => 23, 'name' => 'Tacna'],
            ['departamento_id' => 23, 'name' => 'Candarave'],
            ['departamento_id' => 23, 'name' => 'Jorge Basadre'],
            ['departamento_id' => 23, 'name' => 'Tarata'],

            // TUMBES (3 provincias)
            ['departamento_id' => 24, 'name' => 'Tumbes'],
            ['departamento_id' => 24, 'name' => 'Contralmirante Villar'],
            ['departamento_id' => 24, 'name' => 'Zarumilla'],

            // UCAYALI (4 provincias)
            ['departamento_id' => 25, 'name' => 'Coronel Portillo'],
            ['departamento_id' => 25, 'name' => 'Atalaya'],
            ['departamento_id' => 25, 'name' => 'Padre Abad'],
            ['departamento_id' => 25, 'name' => 'Purús'],
        ];

        foreach ($provincias as $provincia) {
            DB::table('provincias')->insert([
                'departamento_id' => $provincia['departamento_id'],
                'name' => $provincia['name'],
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
