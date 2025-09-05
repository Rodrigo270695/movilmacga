<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\WorkingSessionsAndTrackingSeeder;

class CreateComprehensiveWorkingSessionsData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reportes:seed-comprehensive-sessions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear datos completos de jornadas laborales con GPS tracking y visitas PDV para demostración del modal';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando creación de datos completos de jornadas laborales...');
        $this->info('📱 Este seeder incluye:');
        $this->info('   • Jornadas laborales realistas');
        $this->info('   • GPS tracking detallado');
        $this->info('   • Visitas a PDVs');
        $this->info('   • Datos para visualización en modal');
        $this->newLine();

        try {
            // Ejecutar el seeder completo
            $seeder = new WorkingSessionsAndTrackingSeeder();
            $seeder->setCommand($this);
            $seeder->run();

            $this->newLine();
            $this->info('🎉 ¡Datos completos creados exitosamente!');
            $this->newLine();
            
            $this->info('🔗 URLs para probar:');
            $this->info('   📊 Reporte de Jornadas: /reportes/jornadas-laborales');
            $this->info('   🗺️  Sistema de Tracking: /mapas/tracking');
            $this->newLine();
            
            $this->info('✨ Funcionalidades disponibles:');
            $this->info('   • Haz clic en el botón de PDVs para ver el modal');
            $this->info('   • El modal mostrará:');
            $this->info('     - 🚀 Inicio de jornada (verde)');
            $this->info('     - 🏁 Fin de jornada (rojo)');
            $this->info('     - 📍 Línea de GPS tracking (púrpura)');
            $this->info('     - 🏪 PDVs visitados (verde) y pendientes (azul)');
            $this->info('     - ⚡ Información detallada de cada punto GPS');
            $this->newLine();
            
            $this->info('🎯 Para mejores resultados:');
            $this->info('   • Filtra por fecha actual o últimos días');
            $this->info('   • Selecciona jornadas "Completadas" para ver tracking completo');
            $this->info('   • Haz clic en puntos del mapa para ver detalles');

        } catch (\Exception $e) {
            $this->error('❌ Error durante la creación de datos:');
            $this->error($e->getMessage());
            return 1;
        }

        return 0;
    }
}


