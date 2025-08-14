<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessForm;
use App\Models\Pdv;
use App\Models\PdvVisit;
use App\Models\PdvVisitFormResponse;
use App\Models\PdvFormAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FormController extends Controller
{
    /**
     * Obtener el formulario asignado a un PDV específico
     */
    public function getPdvForm(Request $request, $pdvId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que el PDV existe
            $pdv = Pdv::find($pdvId);
            if (!$pdv) {
                return response()->json([
                    'success' => false,
                    'message' => 'PDV no encontrado'
                ], 404);
            }

            // Obtener el formulario asignado al PDV
            $formAssignment = PdvFormAssignment::where('pdv_id', $pdvId)
                ->where('is_active', true)
                ->with(['businessForm' => function ($query) {
                    $query->with(['activeSections' => function ($sectionQuery) {
                        $sectionQuery->with(['activeFields' => function ($fieldQuery) {
                            $fieldQuery->orderBy('order_index');
                        }])->orderBy('order_index');
                    }]);
                }])
                ->first();

            if (!$formAssignment || !$formAssignment->businessForm) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay formulario asignado a este PDV',
                    'data' => null
                ], 404);
            }

            $form = $formAssignment->businessForm;
            $formStructure = $form->getFormStructure();

            return response()->json([
                'success' => true,
                'message' => 'Formulario obtenido exitosamente',
                'data' => $formStructure
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el formulario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar las respuestas del formulario para una visita específica
     */
    public function saveFormResponses(Request $request, $visitId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que la visita existe y pertenece al usuario
            $visit = PdvVisit::where('id', $visitId)
                ->where('user_id', $user->id)
                ->first();

            if (!$visit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visita no encontrada'
                ], 404);
            }

            // Verificar que la visita esté completada
            if (!$visit->check_out_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'La visita debe estar completada para guardar el formulario'
                ], 400);
            }

            // Obtener el formulario asignado al PDV
            $formAssignment = PdvFormAssignment::where('pdv_id', $visit->pdv_id)
                ->where('is_active', true)
                ->with('businessForm.activeSections.activeFields')
                ->first();

            if (!$formAssignment || !$formAssignment->businessForm) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay formulario asignado a este PDV'
                ], 404);
            }

            $responses = $request->input('responses', []);

            if (empty($responses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se proporcionaron respuestas'
                ], 400);
            }

            // Validar y guardar cada respuesta
            $savedResponses = [];
            $errors = [];

            foreach ($responses as $fieldId => $responseData) {
                // Verificar que el campo existe y pertenece al formulario
                $field = $formAssignment->businessForm->activeFields
                    ->where('id', $fieldId)
                    ->first();

                if (!$field) {
                    $errors[] = "Campo ID {$fieldId} no encontrado";
                    continue;
                }

                // Validar la respuesta según el tipo de campo
                $validationResult = $this->validateFieldResponse($field, $responseData);
                if (!$validationResult['valid']) {
                    $errors[] = "Campo '{$field->label}': " . $validationResult['message'];
                    continue;
                }

                // Guardar la respuesta
                $formResponse = PdvVisitFormResponse::updateOrCreate(
                    [
                        'pdv_visit_id' => $visitId,
                        'form_field_id' => $fieldId,
                    ],
                    [
                        'response_value' => $responseData['value'] ?? null,
                        'response_file' => $responseData['file'] ?? null,
                        'response_location' => $responseData['location'] ?? null,
                        'response_signature' => $responseData['signature'] ?? null,
                        'response_metadata' => $responseData['metadata'] ?? null,
                    ]
                );

                $savedResponses[] = $formResponse;
            }

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $errors,
                    'saved_responses' => count($savedResponses)
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Respuestas guardadas exitosamente',
                'data' => [
                    'visit_id' => $visitId,
                    'total_responses' => count($savedResponses),
                    'responses' => $savedResponses
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar las respuestas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir archivo para un campo específico
     */
    public function uploadFile(Request $request, $visitId, $fieldId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que la visita existe y pertenece al usuario
            $visit = PdvVisit::where('id', $visitId)
                ->where('user_id', $user->id)
                ->first();

            if (!$visit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visita no encontrada'
                ], 404);
            }

            // Obtener el campo del formulario
            $formAssignment = PdvFormAssignment::where('pdv_id', $visit->pdv_id)
                ->where('is_active', true)
                ->with('businessForm.activeSections.activeFields')
                ->first();

            if (!$formAssignment || !$formAssignment->businessForm) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay formulario asignado a este PDV'
                ], 404);
            }

            $field = $formAssignment->businessForm->activeFields
                ->where('id', $fieldId)
                ->first();

            if (!$field) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campo no encontrado'
                ], 404);
            }

            // Verificar que el campo es de tipo archivo
            if (!$field->isFileType()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este campo no acepta archivos'
                ], 400);
            }

            // Validar el archivo
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:' . ($field->max_file_size ?? 5120), // 5MB por defecto
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');

            // Validar tipo de archivo
            if ($field->file_types) {
                $allowedTypes = $field->getAllowedFileTypes();
                $fileExtension = strtolower($file->getClientOriginalExtension());

                if (!in_array($fileExtension, $allowedTypes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tipo de archivo no permitido. Tipos permitidos: ' . implode(', ', $allowedTypes)
                    ], 422);
                }
            }

            // Generar nombre único para el archivo
            $fileName = 'form_files/' . $visitId . '/' . $fieldId . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Guardar el archivo
            $filePath = $file->storeAs('public', $fileName);

            if (!$filePath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al guardar el archivo'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Archivo subido exitosamente',
                'data' => [
                    'file_path' => $fileName,
                    'file_url' => asset('storage/' . $fileName),
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getMimeType()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener las respuestas de una visita específica
     */
    public function getVisitResponses(Request $request, $visitId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que la visita existe y pertenece al usuario
            $visit = PdvVisit::where('id', $visitId)
                ->where('user_id', $user->id)
                ->with(['formResponsesWithFields' => function ($query) {
                    $query->with(['formField.section']);
                }])
                ->first();

            if (!$visit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visita no encontrada'
                ], 404);
            }

            $responses = $visit->formResponsesWithFields->map(function ($response) {
                return [
                    'field_id' => $response->form_field_id,
                    'field_label' => $response->formField->label,
                    'field_type' => $response->formField->field_type,
                    'section_name' => $response->formField->section->name,
                    'response_value' => $response->getResponseValue(),
                    'formatted_value' => $response->getFormattedValue(),
                    'has_file' => $response->hasFile(),
                    'file_url' => $response->getFileUrl(),
                    'has_location' => $response->hasLocation(),
                    'location_coordinates' => $response->getLocationCoordinates(),
                    'has_signature' => $response->hasSignature(),
                    'created_at' => $response->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Respuestas obtenidas exitosamente',
                'data' => [
                    'visit_id' => $visitId,
                    'pdv_name' => $visit->pdv->point_name,
                    'check_in_at' => $visit->check_in_at,
                    'check_out_at' => $visit->check_out_at,
                    'total_responses' => $responses->count(),
                    'responses' => $responses
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las respuestas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validar la respuesta de un campo según su tipo
     */
    private function validateFieldResponse($field, $responseData): array
    {
        $value = $responseData['value'] ?? null;
        $file = $responseData['file'] ?? null;
        $location = $responseData['location'] ?? null;
        $signature = $responseData['signature'] ?? null;

        // Validar campo requerido
        if ($field->is_required) {
            switch ($field->field_type) {
                case 'image':
                case 'pdf':
                case 'video':
                case 'audio':
                    if (!$file) {
                        return ['valid' => false, 'message' => 'Archivo requerido'];
                    }
                    break;
                case 'location':
                    if (!$location) {
                        return ['valid' => false, 'message' => 'Ubicación requerida'];
                    }
                    break;
                case 'signature':
                    if (!$signature) {
                        return ['valid' => false, 'message' => 'Firma requerida'];
                    }
                    break;
                default:
                    if (empty($value)) {
                        return ['valid' => false, 'message' => 'Valor requerido'];
                    }
                    break;
            }
        }

        // Validaciones específicas por tipo
        switch ($field->field_type) {
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return ['valid' => false, 'message' => 'Email inválido'];
                }
                break;
            case 'number':
                if ($value && !is_numeric($value)) {
                    return ['valid' => false, 'message' => 'Debe ser un número'];
                }
                if ($value && $field->min_value !== null && $value < $field->min_value) {
                    return ['valid' => false, 'message' => "Valor mínimo: {$field->min_value}"];
                }
                if ($value && $field->max_value !== null && $value > $field->max_value) {
                    return ['valid' => false, 'message' => "Valor máximo: {$field->max_value}"];
                }
                break;
            case 'select':
            case 'radio':
                if ($value && $field->options && !array_key_exists($value, $field->options)) {
                    return ['valid' => false, 'message' => 'Opción no válida'];
                }
                break;
        }

        return ['valid' => true, 'message' => ''];
    }
}
