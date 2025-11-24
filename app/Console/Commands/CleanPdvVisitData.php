<?php

namespace App\Console\Commands;

use App\Models\PdvVisit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanPdvVisitData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdv-visits:clean-data
                            {--dry-run : Ejecutar sin hacer cambios reales}
                            {--min-size=50000 : Tamaño mínimo en bytes para limpiar (default: 50KB)}
                            {--keep-keys=* : Claves JSON a mantener (ej: form_submission,geofence_validation)}
                            {--older-than=30 : Limpiar solo visitas más antiguas que X días}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpiar datos grandes de visit_data en pdv_visits para reducir el tamaño de la tabla';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $minSize = (int) $this->option('min-size');
        $keepKeys = $this->option('keep-keys') ?: ['form_submission', 'geofence_validation', 'check_in_device_info', 'check_out_device_info', 'check_out_location'];
        $olderThan = (int) $this->option('older-than');

        $this->info('🧹 Limpiando datos grandes de visit_data...');
        $this->newLine();

        if ($dryRun) {
            $this->warn('⚠️  MODO DRY-RUN: No se harán cambios reales');
            $this->newLine();
        }

        // Contar visitas con datos grandes
        $query = PdvVisit::whereNotNull('visit_data')
            ->whereRaw('LENGTH(visit_data) > ?', [$minSize])
            ->where('visit_status', 'completed');

        if ($olderThan > 0) {
            $query->where('check_in_at', '<', now()->subDays($olderThan));
        }

        $totalToClean = $query->count();
        $this->info("📊 Visitas encontradas con datos > {$minSize} bytes: {$totalToClean}");

        if ($totalToClean === 0) {
            $this->info('✅ No hay visitas que limpiar.');
            return 0;
        }

        // Calcular espacio que se liberará
        $totalSize = $query->sum(DB::raw('LENGTH(visit_data)'));
        $this->info("💾 Espacio total a limpiar: " . $this->formatBytes($totalSize));
        $this->newLine();

        if (!$dryRun && !$this->confirm('¿Continuar con la limpieza?', true)) {
            $this->info('Operación cancelada.');
            return 0;
        }

        $bar = $this->output->createProgressBar($totalToClean);
        $bar->start();

        $cleaned = 0;
        $spaceSaved = 0;

        $query->chunk(100, function ($visits) use (&$cleaned, &$spaceSaved, $keepKeys, $dryRun, $bar) {
            foreach ($visits as $visit) {
                $originalSize = strlen(json_encode($visit->visit_data));
                $cleanedData = $this->cleanVisitData($visit->visit_data, $keepKeys);
                $newSize = strlen(json_encode($cleanedData));
                $saved = $originalSize - $newSize;

                if (!$dryRun && $saved > 0) {
                    $visit->update(['visit_data' => $cleanedData]);
                }

                $cleaned++;
                $spaceSaved += $saved;
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("📋 RESUMEN (DRY-RUN):");
            $this->info("   - Visitas que se limpiarían: {$cleaned}");
            $this->info("   - Espacio que se liberaría: " . $this->formatBytes($spaceSaved));
            $this->warn("   ⚠️  Ejecuta sin --dry-run para aplicar los cambios");
        } else {
            $this->info("✅ LIMPIEZA COMPLETADA:");
            $this->info("   - Visitas limpiadas: {$cleaned}");
            $this->info("   - Espacio liberado: " . $this->formatBytes($spaceSaved));
            $this->newLine();
            $this->info("💡 Ejecuta 'OPTIMIZE TABLE pdv_visits;' en MySQL para recuperar el espacio físico");
        }

        return 0;
    }

    /**
     * Limpiar visit_data manteniendo solo las claves importantes
     * Elimina datos grandes como imágenes base64, archivos, etc.
     */
    private function cleanVisitData(array $data, array $keepKeys): array
    {
        $cleaned = [];

        foreach ($keepKeys as $key) {
            if (isset($data[$key])) {
                // Limpiar recursivamente si es un array
                if (is_array($data[$key])) {
                    $cleaned[$key] = $this->cleanLargeValues($data[$key]);
                } else {
                    $cleaned[$key] = $data[$key];
                }
            }
        }

        // Limpiar otras claves que puedan tener datos grandes
        foreach ($data as $key => $value) {
            if (in_array($key, $keepKeys)) {
                continue; // Ya lo procesamos arriba
            }

            // Si el valor es muy grande (probablemente base64), eliminarlo
            if (is_string($value) && strlen($value) > 10000) {
                // Probablemente es una imagen/archivo en base64, omitir
                continue;
            }

            // Si es un array, limpiarlo recursivamente
            if (is_array($value)) {
                $cleanedValue = $this->cleanLargeValues($value);
                if (!empty($cleanedValue)) {
                    $cleaned[$key] = $cleanedValue;
                }
            } elseif (strlen($value) <= 1000) {
                // Solo mantener valores pequeños
                $cleaned[$key] = $value;
            }
        }

        // Agregar metadato de limpieza
        $cleaned['_cleaned_at'] = now()->toIso8601String();
        $cleaned['_original_keys'] = array_keys($data);

        return $cleaned;
    }

    /**
     * Limpiar valores grandes de un array recursivamente
     */
    private function cleanLargeValues(array $data): array
    {
        $cleaned = [];

        foreach ($data as $key => $value) {
            if (is_string($value) && strlen($value) > 10000) {
                // Valor muy grande, probablemente base64, reemplazar con placeholder
                $cleaned[$key] = '[DATO_GRANDE_REMOVIDO]';
            } elseif (is_array($value)) {
                $cleaned[$key] = $this->cleanLargeValues($value);
            } else {
                $cleaned[$key] = $value;
            }
        }

        return $cleaned;
    }

    /**
     * Formatear bytes a formato legible
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
