<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Business;
use App\Models\Zonal;
use App\Models\Circuit;
use App\Models\Route;
use App\Models\Pdv;
use App\Models\BusinessForm;
use App\Models\FormSection;
use App\Models\FormField;
use App\Models\PdvFormAssignment;

class TestFormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Crear o obtener un negocio
        $business = Business::firstOrCreate(
            ['name' => 'Negocio de Prueba'],
            [
                'name' => 'Negocio de Prueba',
                'description' => 'Negocio para testing de formularios',
                'is_active' => true,
            ]
        );

        // 2. Crear o obtener un zonal
        $zonal = Zonal::firstOrCreate(
            ['name' => 'Zonal de Prueba'],
            [
                'business_id' => $business->id,
                'name' => 'Zonal de Prueba',
                'status' => true,
            ]
        );

        // 3. Crear o obtener un circuito
        $circuit = Circuit::firstOrCreate(
            ['name' => 'Circuito de Prueba'],
            [
                'zonal_id' => $zonal->id,
                'name' => 'Circuito de Prueba',
                'code' => 'CIR-TEST-001',
                'status' => true,
            ]
        );

        // 4. Crear o obtener una ruta
        $route = Route::firstOrCreate(
            ['name' => 'Ruta de Prueba'],
            [
                'circuit_id' => $circuit->id,
                'name' => 'Ruta de Prueba',
                'code' => 'RUT-TEST-001',
                'status' => true,
            ]
        );

        // 5. Crear o obtener un PDV
        $pdv = Pdv::firstOrCreate(
            ['point_name' => 'PDV de Prueba'],
            [
                'point_name' => 'PDV de Prueba',
                'pos_id' => 'TEST-001',
                'document_type' => 'DNI',
                'document_number' => '12345678',
                'client_name' => 'Cliente de Prueba',
                'classification' => 'bodega',
                'status' => 'vende',
                'address' => 'Dirección de Prueba 123',
                'route_id' => $route->id,
                'district_id' => 1, // Asegúrate de que exista
                'locality' => 'Localidad de Prueba',
                'latitude' => -12.0464,
                'longitude' => -77.0428,
            ]
        );

        // 6. Crear un formulario de negocio
        $businessForm = BusinessForm::firstOrCreate(
            ['name' => 'Formulario de Visita de Prueba'],
            [
                'business_id' => $business->id,
                'name' => 'Formulario de Visita de Prueba',
                'description' => 'Formulario para testing de visitas PDV',
                'is_active' => true,
                'settings' => [
                    'allow_offline' => true,
                    'require_photo' => false,
                ],
            ]
        );

        // 7. Crear secciones del formulario
        $section1 = FormSection::firstOrCreate(
            ['name' => 'Información General'],
            [
                'business_form_id' => $businessForm->id,
                'name' => 'Información General',
                'description' => 'Datos básicos del PDV',
                'order_index' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        $section2 = FormSection::firstOrCreate(
            ['name' => 'Estado del PDV'],
            [
                'business_form_id' => $businessForm->id,
                'name' => 'Estado del PDV',
                'description' => 'Evaluación del estado actual',
                'order_index' => 2,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        // 8. Crear campos del formulario
        $fields = [
            // Sección 1: Información General
            [
                'form_section_id' => $section1->id,
                'field_type' => 'text',
                'label' => 'Nombre del Cliente',
                'placeholder' => 'Ingrese el nombre completo del cliente',
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
            ],
            [
                'form_section_id' => $section1->id,
                'field_type' => 'text',
                'label' => 'Teléfono de Contacto',
                'placeholder' => 'Ingrese el número de teléfono',
                'is_required' => false,
                'order_index' => 2,
                'is_active' => true,
            ],
            [
                'form_section_id' => $section1->id,
                'field_type' => 'select',
                'label' => 'Tipo de PDV',
                'placeholder' => 'Seleccione el tipo',
                'is_required' => true,
                'order_index' => 3,
                'is_active' => true,
                'options' => ['Bodega', 'Farmacia', 'Tienda de Conveniencia', 'Otro'],
            ],

            // Sección 2: Estado del PDV
            [
                'form_section_id' => $section2->id,
                'field_type' => 'select',
                'label' => 'Estado Actual',
                'placeholder' => 'Seleccione el estado',
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'options' => ['Activo', 'Inactivo', 'En Mantenimiento', 'Cerrado'],
            ],
            [
                'form_section_id' => $section2->id,
                'field_type' => 'text',
                'label' => 'Observaciones',
                'placeholder' => 'Ingrese observaciones adicionales',
                'is_required' => false,
                'order_index' => 2,
                'is_active' => true,
            ],
            [
                'form_section_id' => $section2->id,
                'field_type' => 'checkbox',
                'label' => '¿Requiere seguimiento?',
                'placeholder' => 'Marque si requiere seguimiento',
                'is_required' => false,
                'order_index' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($fields as $fieldData) {
            FormField::firstOrCreate(
                [
                    'form_section_id' => $fieldData['form_section_id'],
                    'label' => $fieldData['label'],
                ],
                $fieldData
            );
        }

        // 9. Asignar el formulario al PDV
        PdvFormAssignment::firstOrCreate(
            [
                'pdv_id' => $pdv->id,
                'business_form_id' => $businessForm->id,
            ],
            [
                'pdv_id' => $pdv->id,
                'business_form_id' => $businessForm->id,
                'is_active' => true,
                'settings' => [
                    'custom_instructions' => 'Instrucciones específicas para este PDV',
                ],
            ]
        );

        $this->command->info('✅ Datos de prueba de formularios creados exitosamente');
        $this->command->info("📋 PDV ID: {$pdv->id}");
        $this->command->info("📋 Formulario ID: {$businessForm->id}");
        $this->command->info("📋 Asignación creada para PDV: {$pdv->point_name}");
    }
}
