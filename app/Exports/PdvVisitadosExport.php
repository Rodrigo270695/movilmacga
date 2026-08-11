<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Illuminate\Database\Query\Builder;

class PdvVisitadosExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithChunkReading
{
    protected Builder $queryBuilder;

    public function __construct(Builder $queryBuilder)
    {
        $this->queryBuilder = $queryBuilder;
    }

    public function query(): Builder
    {
        return $this->queryBuilder;
    }

    public function chunkSize(): int
    {
        return 300;
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
            'Mock Location',
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
            'Longitud',
        ];
    }

    public function map($row): array
    {
        $checkIn  = $row->check_in_at  ? new \DateTime($row->check_in_at)  : null;
        $checkOut = $row->check_out_at ? new \DateTime($row->check_out_at) : null;

        return [
            $row->id,
            $checkIn  ? $checkIn->format('d/m/Y')    : 'N/A',
            $checkIn  ? $checkIn->format('H:i:s')    : 'N/A',
            trim(($row->first_name ?? '') . ' ' . ($row->last_name ?? '')),
            $row->username ?? 'N/A',
            $row->point_name  ?? 'N/A',
            $row->client_name ?? 'N/A',
            $row->classification ?? 'N/A',
            $this->formatMockLocation($row->used_mock_location),
            $row->pdv_status ?? 'N/A',
            $row->business_name ?? 'N/A',
            $row->zonal_name    ?? 'N/A',
            $row->circuit_name  ?? 'N/A',
            $row->route_name    ?? 'N/A',
            $this->getEstadoLabel($row->visit_status),
            $row->duration_minutes ?? 'N/A',
            $row->distance_to_pdv  ?? 'N/A',
            $checkOut ? $checkOut->format('d/m/Y H:i:s') : 'N/A',
            $row->latitude  ?? '',
            $row->longitude ?? '',
        ];
    }

    public function styles(Worksheet $sheet): Worksheet
    {
        $sheet->getStyle('A1:T1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['rgb' => '000000'],
                ],
            ],
        ]);

        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle('A2:T' . $lastRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'D3D3D3'],
                    ],
                ],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);

            foreach (['A', 'B', 'C', 'I', 'J', 'O', 'P', 'Q', 'S', 'T'] as $col) {
                $sheet->getStyle($col . ':' . $col)
                    ->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
        }

        return $sheet;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 10,
            'B' => 12,
            'C' => 10,
            'D' => 20,
            'E' => 15,
            'F' => 25,
            'G' => 25,
            'H' => 15,
            'I' => 16,
            'J' => 20,
            'K' => 15,
            'L' => 15,
            'M' => 15,
            'N' => 15,
            'O' => 12,
            'P' => 12,
            'Q' => 18,
            'R' => 12,
            'S' => 12,
            'T' => 12,
        ];
    }

    private function getEstadoLabel(?string $estado): string
    {
        return match ($estado) {
            'in_progress' => 'En Progreso',
            'completed'   => 'Completada',
            'cancelled'   => 'Cancelada',
            default       => 'Desconocido',
        };
    }

    private function formatMockLocation($value): string
    {
        return match (true) {
            $value == 1, $value === true  => 'Mock detectado',
            $value == 0, $value === false => 'Ubicación real',
            default                       => 'Sin dato',
        };
    }
}
