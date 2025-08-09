<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\GpsTrackingSeeder;

class CreateGpsTrackingData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gps:seed {--clean : Limpiar datos existentes antes de crear nuevos}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear datos de tracking GPS de prueba para vendedores';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🛰️ Iniciando creación de datos GPS de prueba...');

        // Ejecutar el seeder
        $seeder = new GpsTrackingSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->info('');
        $this->info('🎉 ¡Listo! Ahora puedes ir al sistema de tracking para ver los vendedores en el mapa.');
        $this->info('👉 URL: /mapas/tracking');
        $this->info('');
        $this->info('💡 Los vendedores "en línea" aparecerán como marcadores en el mapa');
        $this->info('🔄 El auto-refresh actualizará las posiciones cada 30 segundos');
    }
}
