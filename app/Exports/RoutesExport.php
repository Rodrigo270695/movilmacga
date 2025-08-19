<?php

namespace App\Exports;

use App\Models\Route;
use App\Traits\HasBusinessScope;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use Illuminate\Support\Facades\Log;

class RoutesExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    use HasBusinessScope;

    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Route::with([
            'circuit.zonal.business',
            'visitDates' // Incluir fechas de visita
        ])
        ->withCount('pdvs'); // Incluir conteo de PDVs

        // Aplicar filtros de scope automáticos (negocio y zonal)
        $query = $this->applyFullScope($query, 'circuit.zonal.business', 'circuit.zonal');

        // Aplicar filtros de búsqueda
        if (!empty($this->filters['search'])) {
            $searchFilter = $this->filters['search'];
            $query->where(function ($q) use ($searchFilter) {
                $q->where('name', 'like', "%{$searchFilter}%")
                  ->orWhere('code', 'like', "%{$searchFilter}%")
                  ->orWhereHas('circuit', function ($circuitQuery) use ($searchFilter) {
                      $circuitQuery->where('name', 'like', "%{$searchFilter}%")
                                   ->orWhere('code', 'like', "%{$searchFilter}%");
                  });
            });
        }

        // Filtros por zonal
        if (!empty($this->filters['zonal_id'])) {
            $query->whereHas('circuit', function ($circuitQuery) {
                $circuitQuery->where('zonal_id', $this->filters['zonal_id']);
            });
        }

        // Filtros por circuito
        if (!empty($this->filters['circuit_id'])) {
            $query->where('circuit_id', $this->filters['circuit_id']);
        }

        return $query->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nombre de la Ruta',
            'Código de la Ruta',
            'Estado',
            'Circuito',
            'Código del Circuito',
            'Zonal',
            'Negocio',
            'Número de PDVs',
            'Fechas de Visita',
            'Notas de Visita',
            'Fecha de Creación',
            'Última Actualización'
        ];
    }

    public function map($route): array
    {
        // Obtener fechas de visita activas
        $visitDates = $route->visitDates->where('is_active', true);
        $visitDatesText = $visitDates->pluck('visit_date')->map(function($date) {
            return $date->format('d/m/Y');
        })->implode(', ');

        // Obtener notas de visita
        $visitNotes = $visitDates->pluck('notes')->filter()->implode('; ');

        return [
            $route->id,
            $route->name,
            $route->code,
            $route->status ? 'Activo' : 'Inactivo',
            $route->circuit?->name ?? 'Sin circuito',
            $route->circuit?->code ?? 'Sin código',
            $route->circuit?->zonal?->name ?? 'Sin zonal',
            $route->circuit?->zonal?->business?->name ?? 'Sin negocio',
            $route->pdvs_count ?? 0,
            $visitDatesText ?: 'Sin fechas programadas',
            $visitNotes ?: 'Sin notas',
            $route->created_at?->format('d/m/Y H:i:s'),
            $route->updated_at?->format('d/m/Y H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Estilo para el encabezado
        $sheet->getStyle('A1:M1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '059669'], // Emerald
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Altura de fila para el encabezado
        $sheet->getRowDimension('1')->setRowHeight(25);

        // Bordes para toda la tabla
        $lastRow = $sheet->getHighestRow();
        $lastColumn = $sheet->getHighestColumn();

        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
        ]);

        // Centrar columnas específicas
        $sheet->getStyle("A:A")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // ID
        $sheet->getStyle("D:D")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Estado
        $sheet->getStyle("I:I")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Número de PDVs
        $sheet->getStyle("L:M")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Fechas

        return $sheet;
    }
}
