<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\PdvVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PdvVisitFormResponsesController extends Controller
{
    /**
     * Display the form responses for a specific visit.
     */
    public function show(Request $request, PdvVisit $visit)
    {
        // Verificar permisos
        if (!auth()->user()->can('reporte-pdvs-visitados-ver')) {
            abort(403, 'No tienes permisos para ver las respuestas de formularios.');
        }

        // Cargar la visita con todas las relaciones necesarias
        $visit->load([
            'user:id,first_name,last_name,username',
            'pdv:id,point_name,client_name,classification,status',
        ]);



        // Cargar respuestas con campos y secciones usando una consulta más directa
        $formResponses = DB::table('pdv_visit_form_responses')
            ->join('form_fields', 'pdv_visit_form_responses.form_field_id', '=', 'form_fields.id')
            ->join('form_sections', 'form_fields.form_section_id', '=', 'form_sections.id')
            ->where('pdv_visit_form_responses.pdv_visit_id', $visit->id)
            ->select([
                'pdv_visit_form_responses.id',
                'pdv_visit_form_responses.response_value',
                'pdv_visit_form_responses.response_file',
                'pdv_visit_form_responses.response_location',
                'pdv_visit_form_responses.response_signature',
                'pdv_visit_form_responses.response_metadata',
                'form_fields.label as field_label',
                'form_fields.field_type as field_type',
                'form_sections.name as section_name'
            ])
            ->orderBy('form_sections.order_index')
            ->orderBy('form_fields.order_index')
            ->get();

        // Convertir a array y procesar los datos
        $formResponses = $formResponses->map(function ($response) {
            return (object) [
                'id' => $response->id,
                'response_value' => $response->response_value,
                'response_file' => $response->response_file ? asset('storage/' . $response->response_file) : null,
                'response_location' => $response->response_location ? json_decode($response->response_location, true) : null,
                'response_signature' => $response->response_signature ? asset('storage/' . $response->response_signature) : null,
                'response_metadata' => $response->response_metadata ? json_decode($response->response_metadata, true) : null,
                'field_label' => $response->field_label,
                'field_type' => $response->field_type,
                'section_name' => $response->section_name
            ];
        });

        // Agrupar respuestas por sección
        $responsesBySection = $formResponses->groupBy('section_name');



        // Preparar datos para la vista
        $visitData = [
            'id' => $visit->id,
            'check_in_at' => $visit->check_in_at,
            'check_out_at' => $visit->check_out_at,
            'visit_status' => $visit->visit_status,
            'duration_minutes' => $visit->duration_minutes,
            'distance_to_pdv' => $visit->distance_to_pdv,
            'latitude' => $visit->latitude,
            'longitude' => $visit->longitude,
            'notes' => $visit->notes,
            'visit_photo' => $visit->visit_photo,
            'user' => [
                'id' => $visit->user->id,
                'name' => $visit->user->first_name . ' ' . $visit->user->last_name,
                'username' => $visit->user->username,
            ],
            'pdv' => [
                'id' => $visit->pdv->id,
                'point_name' => $visit->pdv->point_name,
                'client_name' => $visit->pdv->client_name,
                'classification' => $visit->pdv->classification,
                'status' => $visit->pdv->status,
            ],
        ];

        return Inertia::render('reportes/pdvs-visitados/formulario', [
            'visit' => $visitData,
            'responsesBySection' => $responsesBySection,
        ]);
    }
}
