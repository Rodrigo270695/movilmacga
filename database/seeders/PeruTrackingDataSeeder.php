<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Business;
use App\Models\Zonal;
use App\Models\Circuit;
use App\Models\Route;
use App\Models\Pdv;
use App\Models\UserCircuit;
use App\Models\GpsTracking;
use App\Models\PdvVisit;
use App\Models\WorkingSession;
use App\Models\CircuitFrequency;
use App\Models\Pais;
use App\Models\Departamento;
use App\Models\Provincia;
use App\Models\Distrito;
use App\Models\Localidad;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PeruTrackingDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🇵🇪 Iniciando seeder de datos para Perú...\n";

        // 1. Crear estructura geográfica base
        $this->createGeographicStructure();

        // 2. Crear negocios
        $businesses = $this->createBusinesses();

        // 3. Crear zonales
        $zonales = $this->createZonales($businesses);

        // 4. Crear circuitos con frecuencias
        $circuits = $this->createCircuits($zonales);

        // 5. Crear rutas
        $routes = $this->createRoutes($circuits);

        // 6. Crear PDVs
        $pdvs = $this->createPdvs($routes);

        // 7. Crear vendedores
        $vendors = $this->createVendors();

        // 8. Asignar vendedores a circuitos
        $this->assignVendorsToCircuits($vendors, $circuits);

        // 9. Simular datos de tracking para el 6 de agosto 2025
        $this->simulateTrackingData($vendors, $pdvs);

        echo "✅ Seeder completado exitosamente!\n";
    }

    private function createGeographicStructure()
    {
        echo "📍 Creando estructura geográfica de Perú...\n";

        // Perú
        $peru = Pais::firstOrCreate(['name' => 'Perú'], ['status' => true]);

        // Lima
        $lima = Departamento::firstOrCreate(
            ['name' => 'Lima', 'pais_id' => $peru->id],
            ['status' => true]
        );

        // Provincia Lima
        $provinciaLima = Provincia::firstOrCreate(
            ['name' => 'Lima', 'departamento_id' => $lima->id],
            ['status' => true]
        );

        // Distritos de Lima
        $distritos = [
            'Miraflores', 'San Isidro', 'Surco', 'La Molina', 'San Borja',
            'Lince', 'Jesús María', 'Pueblo Libre', 'Magdalena', 'Barranco'
        ];

        foreach ($distritos as $distritoName) {
            $distrito = Distrito::firstOrCreate(
                ['name' => $distritoName, 'provincia_id' => $provinciaLima->id],
                ['status' => true]
            );

            // Crear algunas localidades por distrito
            Localidad::firstOrCreate(
                ['name' => $distritoName . ' Centro', 'distrito_id' => $distrito->id],
                ['status' => true]
            );
        }
    }

    private function createBusinesses()
    {
        echo "🏢 Creando negocios...\n";

        $businesses = [];

        $businesses[] = Business::create([
            'name' => 'MovilMax Telecomunicaciones',
            'status' => true
        ]);

        $businesses[] = Business::create([
            'name' => 'TeleCorp Distribución',
            'status' => true
        ]);

        return $businesses;
    }

    private function createZonales($businesses)
    {
        echo "🗺️ Creando zonales...\n";

        $zonales = [];

        // Zonales para MovilMax
        $zonales[] = Zonal::create([
            'name' => 'Lima Norte',
            'business_id' => $businesses[0]->id,
            'status' => true
        ]);

        $zonales[] = Zonal::create([
            'name' => 'Lima Sur',
            'business_id' => $businesses[0]->id,
            'status' => true
        ]);

        // Zonales para TeleCorp
        $zonales[] = Zonal::create([
            'name' => 'Lima Centro',
            'business_id' => $businesses[1]->id,
            'status' => true
        ]);

        $zonales[] = Zonal::create([
            'name' => 'Lima Este',
            'business_id' => $businesses[1]->id,
            'status' => true
        ]);

        return $zonales;
    }

    private function createCircuits($zonales)
    {
        echo "🔄 Creando circuitos con frecuencias...\n";

        $circuits = [];

        // Circuitos para cada zonal
        $circuitData = [
            ['zonal' => $zonales[0], 'name' => 'Miraflores', 'code' => 'MIR-001'],
            ['zonal' => $zonales[0], 'name' => 'San Isidro', 'code' => 'SI-001'],
            ['zonal' => $zonales[1], 'name' => 'Surco', 'code' => 'SUR-001'],
            ['zonal' => $zonales[2], 'name' => 'Centro', 'code' => 'CEN-001'],
        ];

        foreach ($circuitData as $data) {
            $circuit = Circuit::create([
                'name' => $data['name'],
                'code' => $data['code'],
                'zonal_id' => $data['zonal']->id,
                'status' => true
            ]);

            // Crear frecuencias para el circuito (lunes, miércoles, viernes)
            $days = ['monday', 'wednesday', 'friday'];
            foreach ($days as $day) {
                CircuitFrequency::create([
                    'circuit_id' => $circuit->id,
                    'day_of_week' => $day
                ]);
            }

            $circuits[] = $circuit;
        }

        return $circuits;
    }

    private function createRoutes($circuits)
    {
        echo "🛤️ Creando rutas...\n";

        $routes = [];

        foreach ($circuits as $circuit) {
            // 2 rutas por circuito = 8 rutas total
            for ($i = 1; $i <= 2; $i++) {
                $routes[] = Route::create([
                    'name' => $circuit->name . " R{$i}",
                    'code' => $circuit->code . "-R{$i}",
                    'circuit_id' => $circuit->id,
                    'status' => true
                ]);
            }
        }

        return $routes;
    }

    private function createPdvs($routes)
    {
        echo "🏪 Creando PDVs...\n";

        $pdvs = [];
        $miraflores = Distrito::where('name', 'Miraflores')->first(); // Usar distrito de Miraflores

        // Coordenadas reales de Lima para diferentes distritos
        $limaCoordinates = [
            // Miraflores
            [-12.1203, -77.0285], [-12.1215, -77.0275], [-12.1190, -77.0295],
            // San Isidro
            [-12.1000, -77.0350], [-12.1010, -77.0340], [-12.0990, -77.0360],
            // Surco
            [-12.1350, -77.0180], [-12.1360, -77.0170], [-12.1340, -77.0190],
            // Centro
            [-12.0464, -77.0428], [-12.0474, -77.0438], [-12.0454, -77.0418],
            // Más ubicaciones
            [-12.1100, -77.0300], [-12.1150, -77.0250], [-12.1250, -77.0200],
            [-12.0900, -77.0400], [-12.0950, -77.0450], [-12.1050, -77.0350],
            [-12.1300, -77.0150], [-12.1400, -77.0100], [-12.0800, -77.0500],
            [-12.0750, -77.0550]
        ];

        $classifications = ['telecomunicaciones', 'bodega', 'chalequeros', 'otras tiendas'];
        $statuses = ['vende', 'no vende', 'pdv autoactivado'];

        foreach ($routes as $routeIndex => $route) {
            // 2-3 PDVs por ruta para tener ~20 PDVs total
            $pdvsPerRoute = $routeIndex % 2 == 0 ? 3 : 2;

            for ($i = 1; $i <= $pdvsPerRoute; $i++) {
                $coordIndex = (count($pdvs)) % count($limaCoordinates);
                $coord = $limaCoordinates[$coordIndex];

                $currentPdvCount = count($pdvs);
                $pdvs[] = Pdv::create([
                    'point_name' => "PDV " . $route->code . "-{$i}",
                    'pos_id' => "POS" . str_pad($currentPdvCount + 1, 4, '0', STR_PAD_LEFT),
                    'document_type' => $currentPdvCount % 2 == 0 ? 'DNI' : 'RUC',
                    'document_number' => $currentPdvCount % 2 == 0 ?
                        '1234567' . str_pad($currentPdvCount + 10, 2, '0', STR_PAD_LEFT) :
                        '205512345' . str_pad($currentPdvCount + 60, 2, '0', STR_PAD_LEFT),
                    'client_name' => $this->generatePeruvianName(),
                    'email' => 'pdv' . ($currentPdvCount + 1) . '@movilmacga.com',
                    'phone' => '+51 9' . rand(10000000, 99999999),
                    'sells_recharge' => rand(0, 1),
                    'classification' => $classifications[array_rand($classifications)],
                    'status' => $statuses[array_rand($statuses)],
                    'address' => $this->generateLimaAddress(),
                    'reference' => 'Cerca a ' . $this->generateReference(),
                    'latitude' => $coord[0] + (rand(-50, 50) / 10000), // Pequeña variación
                    'longitude' => $coord[1] + (rand(-50, 50) / 10000),
                    'route_id' => $route->id,
                    'district_id' => $miraflores->id,
                    'locality' => 'Centro Comercial'
                ]);
            }
        }

        return $pdvs;
    }

    private function createVendors()
    {
        echo "👥 Creando vendedores...\n";

        $vendors = [];

        $vendorData = [
            ['name' => 'Carlos', 'lastname' => 'Mendoza', 'email' => 'carlos.mendoza@movilmacga.com'],
            ['name' => 'Ana', 'lastname' => 'Rodriguez', 'email' => 'ana.rodriguez@movilmacga.com'],
            ['name' => 'Luis', 'lastname' => 'Garcia', 'email' => 'luis.garcia@movilmacga.com'],
            ['name' => 'Maria', 'lastname' => 'Fernandez', 'email' => 'maria.fernandez@movilmacga.com'],
        ];

        foreach ($vendorData as $index => $data) {
            $vendor = User::create([
                'first_name' => $data['name'],
                'last_name' => $data['lastname'],
                'name' => $data['name'] . ' ' . $data['lastname'],
                'dni' => '1234567' . ($index + 1), // DNI único para cada vendedor
                'username' => strtolower($data['name'] . '.' . $data['lastname']),
                'email' => $data['email'],
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'status' => true // Boolean en lugar de string
            ]);

            // Asignar rol de Vendedor
            $vendor->assignRole('Vendedor');
            $vendors[] = $vendor;
        }

        return $vendors;
    }

    private function assignVendorsToCircuits($vendors, $circuits)
    {
        echo "🔗 Asignando vendedores a circuitos...\n";

        // Asignar cada vendedor a un circuito
        foreach ($vendors as $index => $vendor) {
            UserCircuit::create([
                'user_id' => $vendor->id,
                'circuit_id' => $circuits[$index]->id,
                'is_active' => true,
                'assigned_date' => now()->subDays(30)->toDateString(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    private function simulateTrackingData($vendors, $pdvs)
    {
        echo "📱 Simulando datos de tracking para el 6 de agosto 2025...\n";

        $targetDate = Carbon::create(2025, 8, 6);

        foreach ($vendors as $vendorIndex => $vendor) {
            // Crear sesión de trabajo
            $startTime = $targetDate->copy()->setHour(8)->setMinute(rand(0, 30));
            $endTime = $targetDate->copy()->setHour(17)->setMinute(rand(0, 59));

            $session = WorkingSession::create([
                'user_id' => $vendor->id,
                'started_at' => $startTime,
                'ended_at' => $endTime,
                'start_latitude' => -12.0464 + (rand(-100, 100) / 10000),
                'start_longitude' => -77.0428 + (rand(-100, 100) / 10000),
                'end_latitude' => -12.0464 + (rand(-100, 100) / 10000),
                'end_longitude' => -77.0428 + (rand(-100, 100) / 10000),
                'status' => 'completed',
                'total_duration_minutes' => $startTime->diffInMinutes($endTime)
            ]);

            // Simular ruta GPS durante el día
            $this->simulateGpsRoute($vendor, $startTime, $endTime);

            // Simular visitas a PDVs
            $this->simulatePdvVisits($vendor, $pdvs, $targetDate, $vendorIndex);
        }
    }

    private function simulateGpsRoute($vendor, $startTime, $endTime)
    {
        $currentTime = $startTime->copy();
        $locations = [];

        // Coordenadas base de Lima
        $baseLat = -12.0464;
        $baseLng = -77.0428;

        while ($currentTime <= $endTime) {
            // Simular movimiento durante el día
            $lat = $baseLat + (rand(-200, 200) / 10000);
            $lng = $baseLng + (rand(-200, 200) / 10000);

            $locations[] = [
                'user_id' => $vendor->id,
                'latitude' => $lat,
                'longitude' => $lng,
                'accuracy' => rand(5, 20),
                'speed' => rand(0, 60),
                'heading' => rand(0, 360),
                'battery_level' => rand(20, 100),
                'is_mock_location' => false,
                'recorded_at' => $currentTime->copy(),
                'created_at' => now(),
                'updated_at' => now()
            ];

            // Avanzar 10-15 minutos
            $currentTime->addMinutes(rand(10, 15));
        }

        GpsTracking::insert($locations);
    }

    private function simulatePdvVisits($vendor, $pdvs, $targetDate, $vendorIndex)
    {
        // Obtener PDVs del circuito del vendedor
        $vendorCircuit = $vendor->activeUserCircuits()->first();
        if (!$vendorCircuit) return;

        $circuitPdvs = collect($pdvs)->filter(function ($pdv) use ($vendorCircuit) {
            return $pdv->route->circuit_id == $vendorCircuit->circuit_id;
        });

        if ($circuitPdvs->isEmpty()) return;

        $visitTime = $targetDate->copy()->setHour(9)->setMinute(0);

        foreach ($circuitPdvs as $index => $pdv) {
            // Simular que un vendedor se salta un PDV (para demostrar funcionalidad)
            if ($vendorIndex == 1 && $index == 1) {
                echo "⚠️ Vendedor {$vendor->name} se saltó PDV {$pdv->point_name}\n";
                continue;
            }

            $checkIn = $visitTime->copy()->addMinutes(rand(15, 45));
            $duration = rand(15, 60); // 15-60 minutos
            $checkOut = $checkIn->copy()->addMinutes($duration);

            // Determinar estado de la visita
            $visitStatus = 'completed';
            if ($index == count($circuitPdvs) - 1 && rand(0, 100) < 20) {
                $visitStatus = 'in_progress'; // Última visita a veces queda en progreso
                $checkOut = null;
                $duration = null;
            }

            PdvVisit::create([
                'user_id' => $vendor->id,
                'pdv_id' => $pdv->id,
                'check_in_at' => $checkIn,
                'check_out_at' => $checkOut,
                'latitude' => $pdv->latitude + (rand(-10, 10) / 100000), // Pequeña variación
                'longitude' => $pdv->longitude + (rand(-10, 10) / 100000),
                'distance_to_pdv' => rand(5, 50), // metros
                'visit_photo' => rand(0, 1) ? 'https://via.placeholder.com/400x300?text=PDV+' . $pdv->point_name : null,
                'notes' => $this->generateVisitNotes(),
                'visit_data' => json_encode([
                    'products_sold' => rand(0, 5),
                    'recharge_amount' => rand(10, 100),
                    'customer_satisfaction' => rand(3, 5)
                ]),
                'is_valid' => true,
                'duration_minutes' => $duration,
                'visit_status' => $visitStatus
            ]);

            $visitTime = $checkOut ?: $checkIn->copy()->addMinutes(30);
        }
    }

    private function generatePeruvianName()
    {
        $names = [
            'Carlos Rodriguez', 'Ana Mendoza', 'Luis Garcia', 'Maria Fernandez',
            'José Martinez', 'Carmen Vargas', 'Pedro Gonzalez', 'Rosa Herrera',
            'Miguel Santos', 'Isabel Torres', 'Roberto Flores', 'Elena Castro'
        ];

        return $names[array_rand($names)];
    }

    private function generateLimaAddress()
    {
        $streets = [
            'Av. Larco', 'Av. Pardo', 'Av. Benavides', 'Av. Javier Prado',
            'Av. Arequipa', 'Av. Salaverry', 'Jr. de la Unión', 'Av. Brasil',
            'Av. Colonial', 'Av. Universitaria'
        ];

        return $streets[array_rand($streets)] . ' ' . rand(100, 9999);
    }

    private function generateReference()
    {
        $references = [
            'Plaza de Armas', 'Mercado Central', 'Parque Kennedy', 'Centro Comercial',
            'Estación del Metro', 'Hospital Nacional', 'Universidad', 'Banco',
            'Farmacia', 'Supermercado'
        ];

        return $references[array_rand($references)];
    }

    private function generateVisitNotes()
    {
        $notes = [
            'Cliente muy satisfecho con el servicio',
            'Solicita información sobre nuevos planes',
            'Buena ubicación, alto tráfico',
            'Cliente regular, sin problemas',
            'Necesita más capacitación en productos',
            'Excelente punto de venta'
        ];

        return rand(0, 1) ? $notes[array_rand($notes)] : null;
    }
}
