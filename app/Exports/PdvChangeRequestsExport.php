<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PdvChangeRequestsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle, ShouldAutoSize
{
    protected Collection $changeRequests;

    public function __construct(Collection $changeRequests)
    {
        $this->changeRequests = $changeRequests;
    }

    public function collection()
    {
        return $this->changeRequests;
    }

    public function headings(): array
    {
        return [
            'ID Solicitud',
            'Estado',
            'Fecha Solicitud',
            'Fecha Aprobación',
            'Fecha Rechazo',
            'PDV',
            'Cliente',
            'Negocio',
            'Zonal',
            'Circuito',
            'Ruta',
            'Vendedor',
            'Dirección Original',
            'Dirección Solicitada',
            'Referencia Original',
            'Referencia Solicitada',
            'Coordenadas Originales',
            'Coordenadas Solicitadas',
            'Motivo del Cambio',
            'Motivo de Rechazo',
        ];
    }

    public function map($request): array
    {
        $pdv = $request->pdv;
        $original = is_array($request->original_data) ? $request->original_data : [];
        $changes = is_array($request->changes) ? $request->changes : [];

        $originalAddress = $original['address'] ?? $pdv?->address ?? '-';
        $requestedAddress = $changes['address'] ?? '-';

        $originalReference = $original['reference'] ?? $pdv?->reference ?? '-';
        $requestedReference = $changes['reference'] ?? '-';

        $originalLatitude = $original['latitude'] ?? $pdv?->latitude;
        $originalLongitude = $original['longitude'] ?? $pdv?->longitude;
        $requestedLatitude = $changes['latitude'] ?? null;
        $requestedLongitude = $changes['longitude'] ?? null;

        return [
            $request->id,
            $request->status_label,
            optional($request->created_at)->format('d/m/Y H:i'),
            optional($request->approved_at)->format('d/m/Y H:i') ?: '-',
            optional($request->rejected_at)->format('d/m/Y H:i') ?: '-',
            $pdv?->point_name ?? 'Sin PDV',
            $pdv?->client_name ?? '-',
            $pdv?->route?->circuit?->zonal?->business?->name ?? 'Sin negocio',
            $request->zonal?->name ?? $pdv?->route?->circuit?->zonal?->name ?? 'Sin zonal',
            $pdv?->route?->circuit?->name ?? 'Sin circuito',
            $pdv?->route?->name ?? 'Sin ruta',
            $request->user ? trim($request->user->first_name . ' ' . $request->user->last_name) : 'Sin vendedor',
            $originalAddress ?: '-',
            $requestedAddress ?: '-',
            $originalReference ?: '-',
            $requestedReference ?: '-',
            $this->formatCoordinates($originalLatitude, $originalLongitude),
            $this->formatCoordinates($requestedLatitude, $requestedLongitude),
            $request->reason ?: '-',
            $request->rejection_reason ?: '-',
        ];
    }

    protected function formatCoordinates($latitude, $longitude): string
    {
        if ($latitude === null || $longitude === null || $latitude === '' || $longitude === '') {
            return '-';
        }

        return number_format((float) $latitude, 6) . ', ' . number_format((float) $longitude, 6);
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $this->changeRequests->count() + 1;
        $lastColumn = $sheet->getHighestColumn();

        // Header styles
        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563EB'], // Indigo 600
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);

        // Body alignment and borders
        $sheet->getStyle('A2:' . $lastColumn . $lastRow)->getAlignment()->setVertical(Alignment::VERTICAL_TOP)->setWrapText(true);

        $sheet->getStyle('A1:' . $lastColumn . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        return $sheet;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12,
            'B' => 15,
            'C' => 20,
            'D' => 20,
            'E' => 20,
            'F' => 28,
            'G' => 28,
            'H' => 20,
            'I' => 20,
            'J' => 20,
            'K' => 20,
            'L' => 24,
            'M' => 35,
            'N' => 35,
            'O' => 35,
            'P' => 35,
            'Q' => 25,
            'R' => 25,
            'S' => 35,
            'T' => 35,
        ];
    }

    public function title(): string
    {
        return 'Solicitudes de Cambio PDV';
    }
}

