<?php

namespace App\Exports;

use App\Models\WorkingSession;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

class WorkingSessionsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    protected $sessions;

    public function __construct($sessions)
    {
        $this->sessions = $sessions;
    }

    public function collection()
    {
        return $this->sessions;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Vendedor',
            'Fecha',
            'Hora Inicio',
            'Hora Fin',
            'Duración',
            'Estado',
            'Ruta Asignada',
            'Circuito',
            'PDVs Ruta',
            'PDVs Visitados',
            'Distancia (km)',
            'Notas',
            'Coordenadas Inicio',
            'Coordenadas Fin',
        ];
    }

    public function map($session): array
    {
        return [
            $session->id,
            $session->user->name,
            $session->started_at->format('d/m/Y'),
            $session->started_at->format('H:i'),
            $session->ended_at ? $session->ended_at->format('H:i') : '-',
            $session->duration_formatted,
            $session->status_label,
            $session->assigned_route ? $session->assigned_route->name . ' (' . $session->assigned_route->code . ')' : 'Sin ruta asignada',
            $session->active_circuit ? $session->active_circuit->name : '-',
            $session->route_pdvs_count,
            $session->visited_pdvs_count,
            $session->total_distance_km ? number_format($session->total_distance_km, 1) : '-',
            $session->notes ?: '-',
            $session->start_latitude && $session->start_longitude ?
                $session->start_latitude . ', ' . $session->start_longitude : '-',
            $session->end_latitude && $session->end_longitude ?
                $session->end_latitude . ', ' . $session->end_longitude : '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Estilo para el encabezado
        $sheet->getStyle('A1:O1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '3B82F6'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Estilo para las filas de datos
        $sheet->getStyle('A2:O' . ($this->sessions->count() + 1))->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Bordes para toda la tabla
        $sheet->getStyle('A1:O' . ($this->sessions->count() + 1))->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
        ]);

        // Altura de filas
        $sheet->getRowDimension(1)->setRowHeight(30);
        for ($i = 2; $i <= $this->sessions->count() + 1; $i++) {
            $sheet->getRowDimension($i)->setRowHeight(25);
        }
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,   // ID
            'B' => 25,  // Vendedor
            'C' => 12,  // Fecha
            'D' => 12,  // Hora Inicio
            'E' => 12,  // Hora Fin
            'F' => 15,  // Duración
            'G' => 15,  // Estado
            'H' => 30,  // Ruta Asignada
            'I' => 20,  // Circuito
            'J' => 12,  // PDVs Ruta
            'K' => 15,  // PDVs Visitados
            'L' => 15,  // Distancia
            'M' => 30,  // Notas
            'N' => 25,  // Coordenadas Inicio
            'O' => 25,  // Coordenadas Fin
        ];
    }

    public function title(): string
    {
        return 'Jornadas Laborales';
    }
}
