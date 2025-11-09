<?php

namespace App\Exports;

use App\Models\PdvVisit;
use App\Models\FormField;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Illuminate\Support\Collection;

class PdvVisitadosWithFormResponsesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $visitas;
    protected $formFields;
    protected $baseHeadings;
    protected $formFieldHeadings;

    public function __construct(Collection $visitas)
    {
        $this->visitas = $visitas;
        $this->loadFormFields();
        $this->buildHeadings();
    }

    /**
     * Cargar todos los campos de formulario disponibles
     */
    protected function loadFormFields()
    {
        // Obtener todos los campos de formulario activos que tienen respuestas
        $this->formFields = FormField::with(['formSection.businessForm'])
            ->whereHas('formResponses', function($query) {
                $query->whereIn('pdv_visit_id', $this->visitas->pluck('id'));
            })
            ->where('is_active', true)
            ->orderBy('form_section_id')
            ->orderBy('order_index')
            ->get();
    }

    /**
     * Construir los encabezados dinámicos
     */
    protected function buildHeadings()
    {
        // Encabezados base (siempre presentes)
        $this->baseHeadings = [
            'ID Visita',
            'Fecha',
            'Hora',
            'Vendedor',
            'Usuario',
            'PDV',
            'Cliente',
            'Clasificación',
            'Mock Location',
            'Negocio',
            'Zonal',
            'Circuito',
            'Ruta',
            'Estado Visita',
            'Duración (min)',
            'Distancia (m)',
            'Check-out',
            'Latitud',
            'Longitud'
        ];

        // Encabezados de campos de formulario
        $this->formFieldHeadings = [];
        foreach ($this->formFields as $field) {
            $formName = $field->formSection->businessForm->name ?? 'Formulario';
            $sectionName = $field->formSection->name ?? 'Sección';
            $fieldName = $field->label ?? $field->name;

            $this->formFieldHeadings[] = "{$formName} - {$sectionName} - {$fieldName}";
        }
    }

    public function collection(): Collection
    {
        // Cargar las respuestas de formulario para todas las visitas
        $this->visitas->load([
            'formResponsesWithFields.formField.formSection.businessForm'
        ]);

        return $this->visitas;
    }

    public function headings(): array
    {
        return array_merge($this->baseHeadings, $this->formFieldHeadings);
    }

    public function map($visita): array
    {
        // Datos base de la visita
        $baseData = [
            $visita->id,
            $visita->check_in_at->format('d/m/Y'),
            $visita->check_in_at->format('H:i:s'),
            $visita->user->first_name . ' ' . $visita->user->last_name,
            $visita->user->username,
            $visita->pdv->point_name,
            $visita->pdv->client_name,
            $visita->pdv->classification,
            $this->formatMockLocation($visita->used_mock_location ?? null),
            $visita->pdv->route->circuit->zonal->business->name ?? 'N/A',
            $visita->pdv->route->circuit->zonal->name ?? 'N/A',
            $visita->pdv->route->circuit->name ?? 'N/A',
            $visita->pdv->route->name ?? 'N/A',
            $this->getEstadoLabel($visita->visit_status),
            $visita->duration_minutes ?? 'N/A',
            $visita->distance_to_pdv ?? 'N/A',
            $visita->check_out_at ? $visita->check_out_at->format('d/m/Y H:i:s') : 'N/A',
            $visita->latitude,
            $visita->longitude
        ];

        // Crear un mapa de respuestas por campo_id para acceso rápido
        $responsesMap = $visita->formResponsesWithFields->keyBy('form_field_id');

        // Datos de respuestas de formulario
        $formData = [];
        foreach ($this->formFields as $field) {
            $response = $responsesMap->get($field->id);

            if ($response) {
                $formData[] = $this->formatResponseValue($response);
            } else {
                $formData[] = 'N/A';
            }
        }

        return array_merge($baseData, $formData);
    }

    /**
     * Formatear el valor de respuesta según el tipo de campo
     */
    protected function formatResponseValue($response)
    {
        $field = $response->formField;
        $value = $response->response_value;

        switch ($field->field_type) {
            case 'checkbox':
                return $value ? 'Sí' : 'No';

            case 'radio':
            case 'select':
                // Manejar options de forma más robusta
                $options = $field->options;

                // Si es string, intentar decodificar JSON
                if (is_string($options)) {
                    $decoded = json_decode($options, true);
                    $options = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
                }

                // Asegurar que options sea un array
                if (!is_array($options)) {
                    return $value;
                }

                foreach ($options as $option) {
                    // Verificar que la opción tenga el formato correcto
                    if (is_array($option) && isset($option['value']) && $option['value'] == $value) {
                        return $option['label'] ?? $value;
                    }
                }
                return $value;

            case 'file':
                return $response->response_file ? 'Archivo adjunto' : 'N/A';

            case 'location':
                if ($response->response_location) {
                    $location = $response->response_location;
                    return "Lat: {$location['latitude']}, Lon: {$location['longitude']}";
                }
                return 'N/A';

            case 'signature':
                return $response->response_signature ? 'Firma capturada' : 'N/A';

            case 'date':
                return $value ? date('d/m/Y', strtotime($value)) : 'N/A';

            case 'datetime':
                return $value ? date('d/m/Y H:i', strtotime($value)) : 'N/A';

            case 'textarea':
                // Limitar texto largo para Excel
                return strlen($value) > 100 ? substr($value, 0, 100) . '...' : $value;

            default:
                return $value ?? 'N/A';
        }
    }

    public function styles(Worksheet $sheet)
    {
        $totalColumns = count($this->baseHeadings) + count($this->formFieldHeadings);
        $lastColumn = $this->getColumnLetter($totalColumns);

        // Estilo para el encabezado base
        $baseColumns = $this->getColumnLetter(count($this->baseHeadings));
        $sheet->getStyle("A1:{$baseColumns}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        // Estilo para el encabezado de formularios (diferente color)
        if (count($this->formFieldHeadings) > 0) {
            $formStartColumn = $this->getColumnLetter(count($this->baseHeadings) + 1);
            $sheet->getStyle("{$formStartColumn}1:{$lastColumn}1")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '70AD47'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ]);
        }

        // Estilo para todas las celdas de datos
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle("A2:{$lastColumn}{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'D3D3D3'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            // Centrar columnas específicas
            $sheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // ID
            $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Fecha
            $sheet->getStyle('C:C')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Hora
            $sheet->getStyle('N:N')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Estado Visita
            $sheet->getStyle('O:O')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Duración
            $sheet->getStyle('P:P')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Distancia
            $sheet->getStyle('Q:Q')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Check-out
            $sheet->getStyle('R:S')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Coordenadas
        }

        return $sheet;
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 10,  // ID Visita
            'B' => 12,  // Fecha
            'C' => 10,  // Hora
            'D' => 20,  // Vendedor
            'E' => 15,  // Usuario
            'F' => 25,  // PDV
            'G' => 25,  // Cliente
            'H' => 15,  // Clasificación
            'I' => 16,  // Mock Location
            'J' => 20,  // Negocio
            'K' => 15,  // Zonal
            'L' => 15,  // Circuito
            'M' => 15,  // Ruta
            'N' => 15,  // Estado Visita
            'O' => 12,  // Duración
            'P' => 12,  // Distancia
            'Q' => 18,  // Check-out
            'R' => 12,  // Latitud
            'S' => 12,  // Longitud
        ];

        // Agregar anchos para columnas de formulario
        $currentColumn = 20; // Empezar después de la columna S
        foreach ($this->formFieldHeadings as $index => $heading) {
            $columnLetter = $this->getColumnLetter($currentColumn);
            $widths[$columnLetter] = min(30, max(15, strlen($heading) + 5)); // Ancho dinámico
            $currentColumn++;
        }

        return $widths;
    }

    /**
     * Convertir número de columna a letra (A, B, C, ..., Z, AA, AB, etc.)
     */
    protected function getColumnLetter($columnNumber)
    {
        $letter = '';
        while ($columnNumber > 0) {
            $columnNumber--;
            $letter = chr(65 + ($columnNumber % 26)) . $letter;
            $columnNumber = intval($columnNumber / 26);
        }
        return $letter;
    }

    private function getEstadoLabel($estado)
    {
        return match($estado) {
            'in_progress' => 'En Progreso',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
            default => 'Desconocido'
        };
    }

    private function formatMockLocation($value)
    {
        return match(true) {
            $value === true => 'Mock detectado',
            $value === false => 'Ubicación real',
            default => 'Sin dato'
        };
    }
}
