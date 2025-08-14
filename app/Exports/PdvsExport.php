<?php

namespace App\Exports;

use App\Models\Pdv;
use App\Traits\HasBusinessScope;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use Illuminate\Http\Request;

class PdvsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    use HasBusinessScope;

    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Pdv::with([
            'route.circuit.zonal.business',
            'district.provincia.departamento',
            'route.circuit.userCircuits.user' // Agregar relación con vendedores
        ])
        ->select([
            'id', 'point_name', 'pos_id', 'document_type', 'document_number',
            'client_name', 'phone', 'email', 'classification', 'status',
            'sells_recharge', 'address', 'reference', 'latitude', 'longitude',
            'route_id', 'district_id', 'locality', 'created_at', 'updated_at'
        ]);

        // Aplicar filtros de scope automáticos (comentado temporalmente para debug)
        // $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        // Aplicar filtros de búsqueda
        if (!empty($this->filters['search'])) {
            $searchFilter = $this->filters['search'];
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                  ->orWhere('client_name', 'like', "%{$searchFilter}%")
                  ->orWhere('document_number', 'like', "%{$searchFilter}%")
                  ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                  ->orWhere('locality', 'like', "%{$searchFilter}%")
                  ->orWhereHas('route', function ($routeQuery) use ($searchFilter) {
                      $routeQuery->where('name', 'like', "%{$searchFilter}%")
                                 ->orWhere('code', 'like', "%{$searchFilter}%");
                  });
            });
        }

        // Filtros básicos
        if (!empty($this->filters['route_id'])) {
            $query->byRoute($this->filters['route_id']);
        }

        if (!empty($this->filters['status'])) {
            $query->byStatus($this->filters['status']);
        }

        if (!empty($this->filters['classification'])) {
            $query->byClassification($this->filters['classification']);
        }

        if (!empty($this->filters['district_id'])) {
            $query->byDistrict($this->filters['district_id']);
        }

        if (!empty($this->filters['locality'])) {
            $query->byLocalityText($this->filters['locality']);
        }

        // Filtros avanzados
        if (!empty($this->filters['document_type'])) {
            $query->where('document_type', $this->filters['document_type']);
        }

        if (!empty($this->filters['sells_recharge'])) {
            $sellsRecharge = $this->filters['sells_recharge'] === 'true';
            $query->bySellsRecharge($sellsRecharge);
        }

        if (!empty($this->filters['circuit_id'])) {
            $query->whereHas('route', function ($routeQuery) {
                $routeQuery->where('circuit_id', $this->filters['circuit_id']);
            });
        }

        if (!empty($this->filters['zonal_id'])) {
            $query->whereHas('route.circuit', function ($circuitQuery) {
                $circuitQuery->where('zonal_id', $this->filters['zonal_id']);
            });
        }

        if (!empty($this->filters['document_number'])) {
            $query->where('document_number', 'like', "%{$this->filters['document_number']}%");
        }

        if (!empty($this->filters['client_name'])) {
            $query->where('client_name', 'like', "%{$this->filters['client_name']}%");
        }

        if (!empty($this->filters['point_name'])) {
            $query->where('point_name', 'like', "%{$this->filters['point_name']}%");
        }

        if (!empty($this->filters['pos_id'])) {
            $query->where('pos_id', 'like', "%{$this->filters['pos_id']}%");
        }

        return $query->orderBy('point_name');
    }

    public function headings(): array
    {
        return [
            'ID',
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
            'Última Actualización'
        ];
    }

    public function map($pdv): array
    {
        // Obtener el vendedor asignado al circuito
        $vendedor = 'Sin asignar';
        if ($pdv->route?->circuit?->userCircuits) {
            $activeUserCircuit = $pdv->route->circuit->userCircuits->where('is_active', true)->first();
            if ($activeUserCircuit && $activeUserCircuit->user) {
                $vendedor = $activeUserCircuit->user->first_name . ' ' . $activeUserCircuit->user->last_name;
            }
        }

        return [
            $pdv->id,
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
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Estilo para el encabezado
        $sheet->getStyle('A1:Z1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'], // Indigo
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
        $sheet->getStyle("K:K")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Vende Recarga
        $sheet->getStyle("J:J")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Estado
        $sheet->getStyle("V:V")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Vendedor Asignado
        $sheet->getStyle("AA:AB")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Fechas (actualizado)

        return $sheet;
    }
}
