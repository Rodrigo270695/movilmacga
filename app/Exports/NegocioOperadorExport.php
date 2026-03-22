<?php

namespace App\Exports;

use App\Models\Operator;
use App\Models\Pdv;
use App\Models\PdvBusinessTypeOperator;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NegocioOperadorExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    /**
     * @param  \Illuminate\Support\Collection<int, Pdv>  $pdvs
     * @param  \Illuminate\Support\Collection<int, Operator>  $operators
     */
    public function __construct(
        protected Collection $pdvs,
        protected Collection $operators,
        protected bool $isVendor = false
    ) {}

    public function collection(): Collection
    {
        return $this->pdvs;
    }

    public function headings(): array
    {
        $base = [
            'Nombre del Punto',
            'POS ID',
            'Tipo de Documento',
            'Número de Documento',
            'Nombre del Cliente',
            'Zonal',
            'Circuito',
            'Ruta',
            'Código de Ruta',
            'Vendedor Asignado',
            'Tipos de negocio',
        ];
        if (! $this->isVendor) {
            array_unshift($base, 'Negocio');
        }

        $operatorHeadings = [];
        foreach ($this->operators as $op) {
            $operatorHeadings[] = $op->name.' Prepago';
            $operatorHeadings[] = $op->name.' Pospago';
        }

        return array_merge($base, $operatorHeadings);
    }

    /**
     * @param  Pdv  $pdv
     */
    public function map($pdv): array
    {
        $route = $pdv->route;
        $circuit = $route?->circuit;
        $zonal = $circuit?->zonal;
        $business = $zonal?->business;

        $vendedor = 'Sin asignar';
        if ($circuit?->userCircuits) {
            $activeUserCircuit = $circuit->userCircuits->where('is_active', true)->first();
            if ($activeUserCircuit && $activeUserCircuit->user) {
                $u = $activeUserCircuit->user;
                $name = trim(($u->first_name ?? '').' '.($u->last_name ?? ''));
                $vendedor = $name !== '' ? $name : ($u->name ?? 'Sin asignar');
            }
        }

        $tiposNegocio = $pdv->pdvBusinessTypes
            ? $pdv->pdvBusinessTypes->pluck('business_type')->unique()->sort()->values()->implode(', ')
            : '';

        $row = [
            $pdv->point_name,
            $pdv->pos_id,
            $pdv->document_type,
            $pdv->document_number,
            $pdv->client_name,
            $zonal?->name ?? '',
            $circuit?->name ?? '',
            $route?->name ?? '',
            $route?->code ?? '',
            $vendedor,
            $tiposNegocio,
        ];
        if (! $this->isVendor) {
            array_unshift($row, $business?->name ?? '');
        }

        foreach ($this->operators as $op) {
            $row[] = $this->pdvHasOperatorMode($pdv, (int) $op->id, PdvBusinessTypeOperator::SALE_PREPAGO) ? 'Si' : 'No';
            $row[] = $this->pdvHasOperatorMode($pdv, (int) $op->id, PdvBusinessTypeOperator::SALE_POSPAGO) ? 'Si' : 'No';
        }

        return $row;
    }

    private function pdvHasOperatorMode(Pdv $pdv, int $operatorId, string $saleMode): bool
    {
        if (! $pdv->relationLoaded('pdvBusinessTypes')) {
            return false;
        }
        foreach ($pdv->pdvBusinessTypes as $pbt) {
            foreach ($pbt->businessTypeOperators as $bto) {
                if ($bto->status && (int) $bto->operator_id === $operatorId && $bto->sale_mode === $saleMode) {
                    return true;
                }
            }
        }

        return false;
    }

    public function styles(Worksheet $sheet): void
    {
        $lastColumn = Coordinate::stringFromColumnIndex($this->columnCount());

        $sheet->getStyle('A1:'.$lastColumn.'1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        $sheet->getRowDimension('1')->setRowHeight(25);

        $lastRow = $sheet->getHighestRow();
        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
        ]);

        $vendedorCol = $this->isVendor ? 10 : 11;
        $tiposCol = $this->isVendor ? 11 : 12;
        $sheet->getStyle(Coordinate::stringFromColumnIndex($vendedorCol).':'.Coordinate::stringFromColumnIndex($vendedorCol))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle(Coordinate::stringFromColumnIndex($tiposCol).':'.Coordinate::stringFromColumnIndex($tiposCol))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $firstOpCol = $this->baseColumnCount() + 1;
        if ($firstOpCol <= $this->columnCount()) {
            $sheet->getStyle(
                Coordinate::stringFromColumnIndex($firstOpCol).':'.$lastColumn
            )->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }

    private function baseColumnCount(): int
    {
        return $this->isVendor ? 11 : 12;
    }

    private function columnCount(): int
    {
        return $this->baseColumnCount() + 2 * $this->operators->count();
    }
}
