<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class TestMapEndpoint extends Command
{
    protected $signature = 'test:map-endpoint';
    protected $description = 'Probar el endpoint del mapa directamente';

    public function handle()
    {
        $this->info('🧪 Probando endpoint del mapa...');

        $today = Carbon::today()->toDateString();
        $this->info("📅 Fecha de hoy: {$today}");

        // URL del endpoint
        $url = url('/mapas/tracking/api/locations/real-time');
        $this->info("🔗 URL: {$url}");

        try {
            // Hacer petición con fecha
            $response = Http::get($url, [
                'date_from' => $today
            ]);

            $this->info("📡 Status HTTP: {$response->status()}");

            if ($response->successful()) {
                $data = $response->json();
                $this->info("📊 Respuesta:");
                $this->line("  - Ubicaciones: " . count($data['locations'] ?? []));
                $this->line("  - Fecha filtro: " . ($data['date_filter'] ?? 'N/A'));
                $this->line("  - Timestamp: " . ($data['timestamp'] ?? 'N/A'));

                if (!empty($data['locations'])) {
                    $this->info("📍 Primera ubicación:");
                    $location = $data['locations'][0];
                    $this->line("  - Usuario: " . ($location['user']['email'] ?? 'N/A'));
                    $this->line("  - Coordenadas: " . ($location['latitude'] ?? 'N/A') . ', ' . ($location['longitude'] ?? 'N/A'));
                    $this->line("  - Registrado: " . ($location['recorded_at'] ?? 'N/A'));
                }
            } else {
                $this->error("❌ Error HTTP: {$response->status()}");
                $this->error("📝 Respuesta: " . $response->body());
            }

        } catch (\Exception $e) {
            $this->error("💥 Error: " . $e->getMessage());
        }
    }
}
