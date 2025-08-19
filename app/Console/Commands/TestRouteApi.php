<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Route;
use App\Models\Pdv;

class TestRouteApi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:route-api {route_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar la API de rutas para obtener PDVs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $routeId = $this->argument('route_id');

        $this->info("🔍 Probando API de ruta ID: {$routeId}");

        try {
            // Buscar la ruta
            $route = Route::find($routeId);

            if (!$route) {
                $this->error("❌ Ruta con ID {$routeId} no encontrada");
                return 1;
            }

            $this->info("✅ Ruta encontrada: {$route->name} ({$route->code})");

            // Obtener PDVs
            $pdvs = $route->pdvs()
                ->with(['locality'])
                ->select([
                    'id',
                    'point_name',
                    'client_name',
                    'pos_id',
                    'address',
                    'latitude',
                    'longitude',
                    'status',
                    'locality_id'
                ])
                ->get();

            $this->info("📊 PDVs encontrados: {$pdvs->count()}");

            // Mostrar estadísticas
            $active = $pdvs->where('status', 'vende')->count();
            $inactive = $pdvs->where('status', '!=', 'vende')->count();
            $withCoords = $pdvs->whereNotNull('latitude')->whereNotNull('longitude')->count();

            $this->line("  • Activos: {$active}");
            $this->line("  • Inactivos: {$inactive}");
            $this->line("  • Con coordenadas: {$withCoords}");

            // Mostrar algunos PDVs de ejemplo
            if ($pdvs->count() > 0) {
                $this->line("\n📋 Primeros 3 PDVs:");
                $pdvs->take(3)->each(function ($pdv) {
                    $this->line("  • {$pdv->point_name} ({$pdv->client_name}) - {$pdv->status}");
                    if ($pdv->latitude && $pdv->longitude) {
                        $this->line("    Coordenadas: {$pdv->latitude}, {$pdv->longitude}");
                    }
                });
            }

            $this->info("✅ Prueba completada exitosamente");
            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            $this->error("📄 Stack trace: " . $e->getTraceAsString());
            return 1;
        }
    }
}
