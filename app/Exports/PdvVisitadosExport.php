<?php

namespace App\Exports;

use App\Models\PdvVisit;
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

class PdvVisitadosExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $visitas;

    public function __construct(Collection $visitas)
    {
        $this->visitas = $visitas;
    }

    public function collection(): Collection
    {
        return $this->visitas;
    }

    public function headings(): array
    {
        return [
            'ID Visita',
            'Fecha',
            'Hora',
            'Vendedor',
            'Usuario',
            'PDV',
            'Cliente',
            'Clasificación',
            'Estado PDV',
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
    }

    public function map($visita): array
    {
        return [
            $visita->id,
            $visita->check_in_at->format('d/m/Y'),
            $visita->check_in_at->format('H:i:s'),
            $visita->user->first_name . ' ' . $visita->user->last_name,
            $visita->user->username,
            $visita->pdv->point_name,
            $visita->pdv->client_name,
            $visita->pdv->classification,
            $visita->pdv->status,
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
    }

    public function styles(Worksheet $sheet)
    {
        // Estilo para el encabezado
        $sheet->getStyle('A1:S1')->applyFromArray([
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

        // Estilo para todas las celdas de datos
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle('A2:S' . $lastRow)->applyFromArray([
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
        return [
            'A' => 10,  // ID Visita
            'B' => 12,  // Fecha
            'C' => 10,  // Hora
            'D' => 20,  // Vendedor
            'E' => 15,  // Usuario
            'F' => 25,  // PDV
            'G' => 25,  // Cliente
            'H' => 15,  // Clasificación
            'I' => 12,  // Estado PDV
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
}
