<?php

namespace App\Exports;

use App\Models\Pdv;
use App\Traits\HasBusinessScope;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class PdvsOperatorsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    use HasBusinessScope;

    protected array $filters;
    protected $operators;

    public function __construct(array $filters = [], $operators = null)
    {
        $this->filters = $filters;
        $this->operators = $operators ?? \App\Models\Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);
    }

    public function collection(): Collection
    {
        $query = Pdv::with([
            'route.circuit.zonal.business',
            'route.visitDates',
            'district.provincia.departamento',
            'route.circuit.userCircuits.user',
            'operators' => fn ($q) => $q->withPivot('status'),
        ])
            ->select([
                'id', 'point_name', 'pos_id', 'document_type', 'document_number',
                'client_name', 'phone', 'email', 'classification', 'status',
                'sells_recharge', 'address', 'reference', 'latitude', 'longitude',
                'route_id', 'district_id', 'locality', 'created_at', 'updated_at',
            ]);

        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        if (!empty($this->filters['search'])) {
            $s = $this->filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('point_name', 'like', "%{$s}%")
                    ->orWhere('client_name', 'like', "%{$s}%")
                    ->orWhere('document_number', 'like', "%{$s}%")
                    ->orWhere('pos_id', 'like', "%{$s}%")
                    ->orWhereHas('route', fn ($r) => $r->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"));
            });
        }
        if (!empty($this->filters['business_id'])) {
            $query->whereHas('route.circuit.zonal', fn ($q) => $q->where('business_id', $this->filters['business_id']));
        }
        if (!empty($this->filters['zonal_id'])) {
            $query->whereHas('route.circuit', fn ($q) => $q->where('zonal_id', $this->filters['zonal_id']));
        }
        if (!empty($this->filters['circuit_id'])) {
            $query->whereHas('route', fn ($q) => $q->where('circuit_id', $this->filters['circuit_id']));
        }
        if (!empty($this->filters['route_id'])) {
            $query->where('route_id', $this->filters['route_id']);
        }

        return $query->orderBy('point_name')->get();
    }

    public function headings(): array
    {
        $base = [
            'Nombre del Punto',
            'POS ID',
            'Tipo de Documento',
            'Número de Documento',
            'Nombre del Cliente',
            'Teléfono',
            'Email',
            'Clasificación',
            'Estado',
            'Vende Recarga',
            'Dirección',
            'Referencia',
            'Latitud',
            'Longitud',
            'Ruta',
            'Código de Ruta',
            'Circuito',
            'Zonal',
            'Negocio',
            'Vendedor Asignado',
            'Distrito',
            'Provincia',
            'Departamento',
            'Localidad',
            'Fecha de Creación',
            'Última Actualización',
            'Frecuencia',
        ];
        $operatorHeadings = $this->operators->pluck('name')->toArray();
        return array_merge($base, $operatorHeadings);
    }

    public function map($pdv): array
    {
        $vendedor = 'Sin asignar';
        if ($pdv->route?->circuit?->userCircuits) {
            $activeUserCircuit = $pdv->route->circuit->userCircuits->where('is_active', true)->first();
            if ($activeUserCircuit && $activeUserCircuit->user) {
                $vendedor = $activeUserCircuit->user->first_name . ' ' . $activeUserCircuit->user->last_name;
            }
        }

        $frequencyText = 'Sin frecuencia definida';
        if ($pdv->route && $pdv->route->visitDates) {
            $visitDates = $pdv->route->visitDates->where('is_active', true);
            if ($visitDates->isNotEmpty()) {
                $frequencyDays = $visitDates->pluck('visit_date')
                    ->map(fn ($date) => $date->dayOfWeekIso)
                    ->unique()
                    ->sort()
                    ->map(function ($dayNumber) {
                        $daysSpanish = [
                            1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves',
                            5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo',
                        ];
                        return $daysSpanish[$dayNumber] ?? '';
                    })
                    ->filter()
                    ->implode(', ');
                $frequencyText = $frequencyDays ?: 'Sin frecuencia definida';
            }
        }

        $row = [
            $pdv->point_name,
            $pdv->pos_id,
            $pdv->document_type,
            $pdv->document_number,
            $pdv->client_name,
            $pdv->phone,
            $pdv->email,
            $pdv->classification,
            $pdv->status,
            $pdv->sells_recharge ? 'Sí' : 'No',
            $pdv->address,
            $pdv->reference,
            $pdv->latitude,
            $pdv->longitude,
            $pdv->route?->name ?? 'Sin ruta',
            $pdv->route?->code ?? 'Sin código',
            $pdv->route?->circuit?->name ?? 'Sin circuito',
            $pdv->route?->circuit?->zonal?->name ?? 'Sin zonal',
            $pdv->route?->circuit?->zonal?->business?->name ?? 'Sin negocio',
            $vendedor,
            $pdv->district?->name ?? 'Sin distrito',
            $pdv->district?->provincia?->name ?? 'Sin provincia',
            $pdv->district?->provincia?->departamento?->name ?? 'Sin departamento',
            $pdv->locality,
            $pdv->created_at?->format('d/m/Y H:i:s'),
            $pdv->updated_at?->format('d/m/Y H:i:s'),
            $frequencyText,
        ];

        $operatorStatus = $pdv->operators->keyBy('id');
        foreach ($this->operators as $op) {
            $pivot = $operatorStatus->get($op->id);
            $row[] = ($pivot && $pivot->pivot && $pivot->pivot->status) ? 'Si' : 'No';
        }

        return $row;
    }

    public function styles(Worksheet $sheet)
    {
        $lastColumn = $sheet->getHighestColumn();

        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
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

        $sheet->getStyle('I:I')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Estado
        $sheet->getStyle('J:J')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Vende Recarga
        $sheet->getStyle('T:T')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Vendedor Asignado
        $sheet->getStyle('Y:Z')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Fechas
        $sheet->getStyle('AA:AA')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Frecuencia
        if ($lastColumn !== 'AA') {
            $sheet->getStyle('AB:' . $lastColumn)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Operadores
        }

        return $sheet;
    }
}
