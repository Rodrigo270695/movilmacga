<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pdv;
use App\Models\PdvFormAssignment;
use App\Models\PdvVisit;
use App\Models\PdvVisitFormResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PdvFormController extends Controller
{
    /**
     * Obtener el formulario asignado a un PDV específico
     */
    public function getPdvForm(Request $request, Pdv $pdv)
    {
        $user = $request->user();

        $pdv->loadMissing('route.circuit');

        if (!$pdv->route || !$pdv->route->circuit) {
            return response()->json([
                'success' => false,
                'message' => 'El PDV no tiene un circuito asignado. Contacta al administrador.',
            ], 409);
        }

        // Verificar que el usuario tenga acceso a este PDV
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $pdv->route->circuit_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este PDV.',
            ], 403);
        }

        try {
            // Obtener el formulario del negocio usando INNER JOIN desde PDV hasta Business
            $businessForm = \DB::table('pdvs')
                ->join('routes', 'pdvs.route_id', '=', 'routes.id')
                ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
                ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
                ->join('businesses', 'zonales.business_id', '=', 'businesses.id')
                ->join('business_forms', 'businesses.id', '=', 'business_forms.business_id')
                ->where('pdvs.id', $pdv->id)
                ->where('business_forms.is_active', true)
                ->select('business_forms.*')
                ->first();

            \Log::info('🔍 Debug PdvFormController - Business Form Query:', [
                'pdv_id' => $pdv->id,
                'pdv_name' => $pdv->point_name,
                'found_business_form' => $businessForm ? 'YES' : 'NO',
                'business_form_id' => $businessForm->id ?? 'N/A',
                'business_form_name' => $businessForm->name ?? 'N/A',
            ]);

                        if (!$businessForm) {
                return response()->json([
                    'success' => true,
                    'message' => 'Este PDV no tiene formulario asignado al negocio.',
                    'data' => [
                        'pdv' => [
                            'id' => $pdv->id,
                            'name' => $pdv->point_name,
                            'pos_id' => $pdv->pos_id,
                        ],
                        'form' => null,
                        'has_form' => false
                    ]
                ]);
            }

            // Obtener las secciones y campos del formulario
            $sections = \DB::table('form_sections')
                ->join('form_fields', 'form_sections.id', '=', 'form_fields.form_section_id')
                ->where('form_sections.business_form_id', $businessForm->id)
                ->where('form_sections.is_active', true)
                ->where('form_fields.is_active', true)
                ->orderBy('form_sections.order_index')
                ->orderBy('form_fields.order_index')
                ->select(
                    'form_sections.id as section_id',
                    'form_sections.name as section_name',
                    'form_sections.description as section_description',
                    'form_sections.order_index as section_order',
                    'form_sections.is_required as section_required',
                    'form_sections.settings as section_settings',
                    'form_fields.id as field_id',
                    'form_fields.field_type',
                    'form_fields.label',
                    'form_fields.placeholder',
                    'form_fields.is_required as field_required',
                    'form_fields.validation_rules',
                    'form_fields.options',
                    'form_fields.order_index as field_order',
                    'form_fields.min_value',
                    'form_fields.max_value',
                    'form_fields.file_types',
                    'form_fields.max_file_size',
                    'form_fields.settings as field_settings'
                )
                ->get();

            // Estructurar los datos del formulario
            $formData = [
                'id' => $businessForm->id,
                'name' => $businessForm->name,
                'description' => $businessForm->description,
                'settings' => json_decode($businessForm->settings, true),
                'sections' => []
            ];

            // Agrupar campos por secciones
            $sectionsGrouped = $sections->groupBy('section_id');
            foreach ($sectionsGrouped as $sectionId => $fields) {
                $firstField = $fields->first();
                $sectionData = [
                    'id' => $firstField->section_id,
                    'name' => $firstField->section_name,
                    'description' => $firstField->section_description,
                    'order_index' => $firstField->section_order,
                    'is_required' => $firstField->section_required,
                    'settings' => json_decode($firstField->section_settings, true),
                    'fields' => $fields->map(function ($field) {
                        return [
                            'id' => $field->field_id,
                            'field_type' => $field->field_type,
                            'label' => $field->label,
                            'placeholder' => $field->placeholder,
                            'is_required' => $field->field_required,
                            'validation_rules' => json_decode($field->validation_rules, true),
                            'options' => json_decode($field->options, true),
                            'order_index' => $field->field_order,
                            'min_value' => $field->min_value,
                            'max_value' => $field->max_value,
                            'file_types' => $field->file_types,
                            'max_file_size' => $field->max_file_size,
                            'settings' => json_decode($field->field_settings, true),
                        ];
                    })->values()
                ];
                $formData['sections'][] = $sectionData;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'pdv' => [
                        'id' => $pdv->id,
                        'name' => $pdv->point_name,
                        'pos_id' => $pdv->pos_id,
                    ],
                    'form' => $formData,
                    'has_form' => true
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el formulario del PDV.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar las respuestas del formulario de una visita
     */
    public function saveFormResponses(Request $request, Pdv $pdv)
    {
        $user = $request->user();

        $pdv->loadMissing('route.circuit');

        if (!$pdv->route || !$pdv->route->circuit) {
            return response()->json([
                'success' => false,
                'message' => 'El PDV no tiene un circuito asignado. Contacta al administrador.',
            ], 409);
        }

        // Verificar que el usuario tenga acceso a este PDV
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $pdv->route->circuit_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este PDV.',
            ], 403);
        }

        // Verificar que no haya una visita completada hoy para este PDV
        $todayVisit = DB::table('pdv_visits')
            ->where('user_id', $user->id)
            ->where('pdv_id', $pdv->id)
            ->whereDate('check_in_at', now()->toDateString())
            ->where('visit_status', 'completed')
            ->first();

        if ($todayVisit) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has visitado este PDV hoy. No puedes hacer otra visita en el mismo día.',
                'data' => [
                    'previous_visit_id' => $todayVisit->id,
                    'previous_visit_time' => $todayVisit->check_in_at,
                ]
            ], 400);
        }

        $request->validate([
            'visit_id' => 'required|exists:pdv_visits,id',
            'responses' => 'required|array',
            'responses.*.field_id' => 'required|exists:form_fields,id',
            'responses.*.value' => 'nullable|string',
            'responses.*.file_data' => 'nullable|string', // Base64 para imágenes/firmas
            'responses.*.file_name' => 'nullable|string',
            'responses.*.file_type' => 'nullable|string',
            'responses.*.location' => 'nullable|array',
        ]);

        $visit = PdvVisit::where('id', $request->input('visit_id'))
            ->where('user_id', $user->id)
            ->where('pdv_id', $pdv->id)
            ->first();

        if (!$visit) {
            return response()->json([
                'success' => false,
                'message' => 'Visita no encontrada para este PDV.',
            ], 404);
        }

        if ($visit->visit_status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'La visita ya fue completada o cancelada.',
            ], 409);
        }

        $responses = $request->input('responses');

        try {
            $result = DB::transaction(function () use ($responses, $user, $pdv, $visit) {
                $lockedVisit = PdvVisit::where('id', $visit->id)->lockForUpdate()->firstOrFail();

                foreach ($responses as $response) {
                    $fieldId = $response['field_id'];
                    $value = $response['value'] ?? null;
                    $fileData = $response['file_data'] ?? null;
                    $fileName = $response['file_name'] ?? null;
                    $fileType = $response['file_type'] ?? null;
                    $location = $response['location'] ?? null;

                    $filePath = null;
                    if ($fileData && $fileName) {
                        $filePath = $this->saveFileFromBase64($fileData, $fileName, $fileType, $user->id, $pdv->id);
                    }

                    PdvVisitFormResponse::updateOrCreate(
                        [
                            'pdv_visit_id' => $lockedVisit->id,
                            'form_field_id' => $fieldId,
                        ],
                        [
                            'response_value' => $value,
                            'response_file' => $filePath,
                            'response_location' => $location,
                            'response_metadata' => [
                                'submitted_at' => now('America/Lima'),
                                'user_id' => $user->id,
                                'file_type' => $fileType,
                                'file_name' => $fileName,
                            ],
                        ]
                    );
                }

                $endedAtPeru = now('America/Lima');
                $durationMinutes = $lockedVisit->check_in_at?->diffInMinutes($endedAtPeru);

                $visitData = $lockedVisit->visit_data ?? [];
                $visitData['form_submission'] = [
                    'submitted_at' => $endedAtPeru->toIso8601String(),
                    'responses_count' => count($responses),
                ];

                $lockedVisit->fill([
                    'visit_status' => 'completed',
                    'check_out_at' => $endedAtPeru,
                    'duration_minutes' => $durationMinutes,
                    'visit_data' => $visitData,
                ]);

                $lockedVisit->save();

                return $lockedVisit;
            });

            return response()->json([
                'success' => true,
                'message' => 'Respuestas del formulario guardadas correctamente.',
                'data' => [
                    'visit_id' => $result->id,
                    'responses_count' => count($responses),
                    'visit_completed' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error guardando respuestas del formulario:', [
                'user_id' => $user->id,
                'pdv_id' => $pdv->id,
                'visit_id' => $request->input('visit_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar las respuestas del formulario.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar archivo desde Base64
     */
    private function saveFileFromBase64($base64Data, $fileName, $fileType, $userId, $pdvId)
    {
        try {
            // Remover el prefijo data:image/...;base64, si existe
            $base64Data = preg_replace('/^data:.*?;base64,/', '', $base64Data);

            // Decodificar Base64
            $fileContent = base64_decode($base64Data);

            if ($fileContent === false) {
                throw new \Exception('Datos Base64 inválidos');
            }

            // Crear directorio si no existe
            $directory = "form-responses/{$userId}/{$pdvId}/" . date('Y-m-d');
            $fullPath = storage_path("app/public/{$directory}");

            if (!file_exists($fullPath)) {
                mkdir($fullPath, 0755, true);
            }

            // Generar nombre único para el archivo
            $extension = $this->getFileExtension($fileType);
            $uniqueFileName = uniqid() . '_' . time() . '.' . $extension;
            $filePath = "{$directory}/{$uniqueFileName}";
            $fullFilePath = storage_path("app/public/{$filePath}");

            // Guardar archivo
            if (file_put_contents($fullFilePath, $fileContent) === false) {
                throw new \Exception('No se pudo guardar el archivo');
            }

            Log::info('Archivo guardado exitosamente:', [
                'file_path' => $filePath,
                'file_size' => strlen($fileContent),
                'file_type' => $fileType,
                'user_id' => $userId,
                'pdv_id' => $pdvId
            ]);

            return $filePath;

        } catch (\Exception $e) {
            Log::error('Error guardando archivo:', [
                'error' => $e->getMessage(),
                'file_type' => $fileType,
                'user_id' => $userId,
                'pdv_id' => $pdvId
            ]);
            throw $e;
        }
    }

    /**
     * Obtener extensión del archivo basado en el tipo
     */
    private function getFileExtension($fileType)
    {
        switch ($fileType) {
            case 'image/jpeg':
            case 'image/jpg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/gif':
                return 'gif';
            case 'application/pdf':
                return 'pdf';
            case 'signature':
                return 'png'; // Las firmas se guardan como PNG
            default:
                return 'bin';
        }
    }
}
