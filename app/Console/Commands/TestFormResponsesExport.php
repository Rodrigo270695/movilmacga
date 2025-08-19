<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PdvVisit;
use App\Models\FormField;
use App\Exports\PdvVisitadosWithFormResponsesExport;
use Maatwebsite\Excel\Facades\Excel;

class TestFormResponsesExport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:form-responses-export {--limit=10}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar la exportación de PDVs visitados con respuestas de formulario';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Probando exportación con respuestas de formulario...');

        // Obtener algunas visitas de prueba
        $limit = $this->option('limit');
        $visitas = PdvVisit::with([
            'user:id,first_name,last_name,username',
            'pdv:id,point_name,client_name,classification,status,route_id',
            'pdv.route:id,name,circuit_id',
            'pdv.route.circuit:id,name,code,zonal_id',
            'pdv.route.circuit.zonal:id,name,business_id',
            'pdv.route.circuit.zonal.business:id,name',
            'formResponsesWithFields.formField.formSection.businessForm'
        ])
        ->whereHas('formResponses')
        ->limit($limit)
        ->get();

        if ($visitas->isEmpty()) {
            $this->error('❌ No se encontraron visitas con respuestas de formulario.');
            return 1;
        }

        $this->info("✅ Encontradas {$visitas->count()} visitas con respuestas de formulario.");

        // Contar campos de formulario
        $formFields = FormField::whereHas('formResponses', function($query) use ($visitas) {
            $query->whereIn('pdv_visit_id', $visitas->pluck('id'));
        })->where('is_active', true)->get();

        $this->info("✅ Encontrados {$formFields->count()} campos de formulario con respuestas.");

        // Mostrar información de los campos
        foreach ($formFields as $field) {
            $formName = $field->formSection->businessForm->name ?? 'Formulario';
            $sectionName = $field->formSection->name ?? 'Sección';
            $this->line("  📝 {$formName} - {$sectionName} - {$field->label} ({$field->field_type})");
        }

        // Probar la exportación
        try {
            $this->info('📊 Generando archivo de prueba...');

            $export = new PdvVisitadosWithFormResponsesExport($visitas);
            $headings = $export->headings();

            $this->info("✅ Encabezados generados: " . count($headings) . " columnas");

            // Contar columnas de formulario (encabezados que no son base)
            $baseColumns = 19; // Columnas base fijas
            $formColumns = count($headings) - $baseColumns;

            $this->info("  📋 Columnas base: {$baseColumns}");
            $this->info("  📝 Columnas de formulario: {$formColumns}");

            // Mostrar algunos encabezados de ejemplo
            if ($formColumns > 0) {
                $this->line("\n📋 Encabezados de formulario:");
                $formHeadings = array_slice($headings, $baseColumns, 5);
                foreach ($formHeadings as $heading) {
                    $this->line("  • {$heading}");
                }

                if ($formColumns > 5) {
                    $this->line("  ... y " . ($formColumns - 5) . " más");
                }
            }

            $this->info("\n✅ Exportación configurada correctamente!");
            $this->info("💡 Para generar el archivo real, usa la interfaz web.");

        } catch (\Exception $e) {
            $this->error("❌ Error en la exportación: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
