<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\WorkingSessionsSeeder;

class CreateWorkingSessionsData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reportes:seed-sessions {--clean : Limpiar datos existentes antes de crear nuevos}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear datos de jornadas laborales de prueba para reportes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📊 Iniciando creación de datos de jornadas laborales...');

        // Ejecutar el seeder
        $seeder = new WorkingSessionsSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->info('');
        $this->info('🎉 ¡Listo! Ahora puedes ir al reporte de jornadas laborales.');
        $this->info('👉 URL: /reportes/jornadas-laborales');
        $this->info('');
        $this->info('💡 El reporte mostrará:');
        $this->info('   • Hora de inicio de cada jornada');
        $this->info('   • Ubicación del primer punto GPS');
        $this->info('   • Duración y PDVs visitados');
        $this->info('   • Estado de la jornada (activa, completada, etc.)');
        $this->info('');
        $this->info('🗺️  Puedes ver el mapa con la ruta completa de cada jornada');
    }
}
