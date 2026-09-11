<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PdvFrecuenciaVisitasExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(protected Collection $pdvs)
    {
    }

    public function collection()
    {
        return $this->pdvs;
    }

    public function headings(): array
    {
        return [
            'PDV',
            'Cliente',
            'Estado',
            'Ruta',
            'Circuito',
            'Zonal',
            'Negocio',
            'Días de visita',
            'Visitas / semana',
            'Q visitas / mes (sem × 4)',
            'Fechas programadas en el mes',
        ];
    }

    public function map($pdv): array
    {
        return [
            $pdv->point_name,
            $pdv->client_name,
            $pdv->status === 'vende' ? 'Vende' : 'No vende',
            $pdv->route?->name ?? '-',
            $pdv->route?->circuit?->name ?? '-',
            $pdv->route?->circuit?->zonal?->name ?? '-',
            $pdv->route?->circuit?->zonal?->business?->name ?? '-',
            $pdv->visit_days ?: 'Sin programación',
            $pdv->visits_week,
            $pdv->visits_month,
            $pdv->programmed_month,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563EB'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        $last = $this->pdvs->count() + 1;
        $sheet->getStyle('A1:K'.$last)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 32,
            'B' => 28,
            'C' => 14,
            'D' => 22,
            'E' => 22,
            'F' => 20,
            'G' => 20,
            'H' => 22,
            'I' => 16,
            'J' => 22,
            'K' => 24,
        ];
    }

    public function title(): string
    {
        return 'Frecuencia visitas PDV';
    }
}
