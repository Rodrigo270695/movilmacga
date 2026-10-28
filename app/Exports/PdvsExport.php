<?php

namespace App\Exports;

use App\Models\Pdv;
use App\Support\PdvCatalogs;
use App\Traits\HasBusinessScope;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;

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
        $monthStart = Carbon::now('America/Lima')->startOfMonth()->toDateString();
        $monthEnd = Carbon::now('America/Lima')->endOfMonth()->toDateString();

        $query = Pdv::with([
            'route.circuit.zonal.business',
            'route.visitDates' => function ($q) use ($monthStart, $monthEnd) {
                $q->where('is_active', true)
                    ->whereDate('visit_date', '>=', $monthStart)
                    ->whereDate('visit_date', '<=', $monthEnd);
            },
            'district.provincia.departamento',
            'route.circuit.userCircuits.user',
        ])
        ->select([
            'id', 'point_name', 'pos_id', 'document_type', 'document_number',
            'client_name', 'phone', 'contacto_referencial', 'classification', 'status',
            'clasificacion_pdv', 'tipo_pdv', 'detalle_pdv', 'tipo_portal', 'comercializacion',
            'firmo_contrato', 'tipo_contrato', 'tiene_huellero', 'propiedad_huellero',
            'sells_recharge', 'visita_presencial', 'frecuencia_visita',
            'address', 'reference', 'tipo_zona', 'tipo_zona_urbana', 'detalle_zona_urbana', 'tipo_senal',
            'route_id', 'district_id', 'locality', 'created_at', 'updated_at',
        ]);

        // Aplicar filtros de scope automáticos (negocio y zonal)
        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        // Aplicar filtros de búsqueda
        if (!empty($this->filters['search'])) {
            $searchFilter = $this->filters['search'];
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                  ->orWhere('client_name', 'like', "%{$searchFilter}%")
                  ->orWhere('document_number', 'like', "%{$searchFilter}%")
                  ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                  ->orWhere('status', 'like', "%{$searchFilter}%")
                  ->orWhere('classification', 'like', "%{$searchFilter}%")
                  ->orWhere('locality', 'like', "%{$searchFilter}%")
                  ->orWhereHas('route', function ($routeQuery) use ($searchFilter) {
                      $routeQuery->where('name', 'like', "%{$searchFilter}%")
                                 ->orWhere('code', 'like', "%{$searchFilter}%");
                  });
            });
        }

        // Filtros jerárquicos
        if (!empty($this->filters['business_id'])) {
            $query->whereHas('route.circuit.zonal', function ($q) {
                $q->where('business_id', $this->filters['business_id']);
            });
        }

        if (!empty($this->filters['zonal_id'])) {
            $query->whereHas('route.circuit', function ($q) {
                $q->where('zonal_id', $this->filters['zonal_id']);
            });
        }

        if (!empty($this->filters['circuit_id'])) {
            $query->whereHas('route', function ($q) {
                $q->where('circuit_id', $this->filters['circuit_id']);
            });
        }

        if (!empty($this->filters['route_id'])) {
            $query->where('route_id', $this->filters['route_id']);
        }

        if (isset($this->filters['telegestion']) && $this->filters['telegestion'] !== '' && $this->filters['telegestion'] !== null) {
            $telegestionValue = filter_var($this->filters['telegestion'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($telegestionValue !== null) {
                $query->whereHas('route', function ($routeQuery) use ($telegestionValue) {
                    $routeQuery->where('telegestion', $telegestionValue);
                });
            }
        }

        return $query->orderBy('point_name');
    }

    public function headings(): array
    {
        return [
            'Nombre del Punto',
            'POS ID',
            'Tipo de Documento',
            'N° de Documento (DNI) / RUC',
            'Nombre y Apellidos del Responsable',
            'N° de Contacto del Responsable',
            'Contacto referencial',
            'Rubro principal',
            'Estado de venta',
            'Clasificación PDV',
            'Tipo de PDV',
            'Detalle del PDV',
            'Tipo de portal',
            'Comercialización',
            'Firmó contrato',
            'Tipo de contrato',
            'Tiene huellero',
            'Estatus huellero',
            'Telegestión',
            'Vende Recarga',
            'Frecuencia de visita',
            'Dirección',
            'Referencia',
            'Tipo de zona',
            'Tipo de zona urbana',
            'Detalle zona urbana',
            'Tipo de señal',
            'Ruta',
            'Circuito',
            'Zonal',
            'Vendedor Asignado',
            'Distrito',
            'Provincia',
            'Departamento',
            'Localidad',
            'Frecuencia mes actual',
        ];
    }

    public function map($pdv): array
    {
        $vendedor = 'Sin asignar';
        if ($pdv->route?->circuit?->userCircuits) {
            $activeUserCircuit = $pdv->route->circuit->userCircuits->where('is_active', true)->first();
            if ($activeUserCircuit?->user) {
                $u = $activeUserCircuit->user;
                $name = trim(($u->first_name ?? '').' '.($u->last_name ?? ''));
                $vendedor = $name !== '' ? $name : ($u->name ?? 'Sin asignar');
            }
        }

        $frequencyText = $this->currentMonthFrequency($pdv);

        return [
            $pdv->point_name,
            $pdv->pos_id,
            $pdv->document_type,
            $pdv->document_number,
            $pdv->client_name,
            $pdv->phone,
            $pdv->contacto_referencial,
            PdvCatalogs::label(PdvCatalogs::rubros(), $pdv->classification),
            $pdv->status === 'vende' ? 'Activo' : ($pdv->status === 'no vende' ? 'Inactivo' : $pdv->status),
            PdvCatalogs::label(PdvCatalogs::clasificacionesPdv(), $pdv->clasificacion_pdv),
            PdvCatalogs::label(PdvCatalogs::tiposPdv(), $pdv->tipo_pdv),
            PdvCatalogs::label(PdvCatalogs::detallesPdv(), $pdv->detalle_pdv),
            PdvCatalogs::label(PdvCatalogs::tiposPortal(), $pdv->tipo_portal),
            PdvCatalogs::label(PdvCatalogs::comercializaciones(), $pdv->comercializacion),
            $pdv->firmo_contrato ? 'Sí' : 'No',
            PdvCatalogs::label(PdvCatalogs::tiposContrato(), $pdv->tipo_contrato),
            $pdv->tiene_huellero ? 'Sí' : 'No',
            PdvCatalogs::label(PdvCatalogs::propiedadesHuellero(), $pdv->propiedad_huellero),
            $pdv->route?->telegestion ? 'Sí' : 'No',
            $pdv->sells_recharge ? 'Sí' : 'No',
            PdvCatalogs::label(PdvCatalogs::frecuenciasVisita(), $pdv->frecuencia_visita),
            $pdv->address,
            $pdv->reference,
            PdvCatalogs::label(PdvCatalogs::tiposZona(), $pdv->tipo_zona),
            PdvCatalogs::label(PdvCatalogs::tiposZonaUrbana(), $pdv->tipo_zona_urbana),
            PdvCatalogs::label(PdvCatalogs::detallesZonaUrbana(), $pdv->detalle_zona_urbana),
            PdvCatalogs::label(PdvCatalogs::tiposSenal(), $pdv->tipo_senal),
            $pdv->route?->name ?? 'Sin ruta',
            $pdv->route?->circuit?->name ?? 'Sin circuito',
            $pdv->route?->circuit?->zonal?->name ?? 'Sin zonal',
            $vendedor,
            $pdv->district?->name ?? 'Sin distrito',
            $pdv->district?->provincia?->name ?? 'Sin provincia',
            $pdv->district?->provincia?->departamento?->name ?? 'Sin departamento',
            $pdv->locality,
            $frequencyText,
        ];
    }

    private function currentMonthFrequency($pdv): string
    {
        if (! $pdv->route?->visitDates) {
            return 'Sin frecuencia definida';
        }

        $monthStart = Carbon::now('America/Lima')->startOfMonth()->startOfDay();
        $monthEnd = Carbon::now('America/Lima')->endOfMonth()->endOfDay();

        $visitDates = $pdv->route->visitDates
            ->where('is_active', true)
            ->filter(function ($visitDate) use ($monthStart, $monthEnd) {
                $date = $visitDate->visit_date;

                return $date && $date->between($monthStart, $monthEnd);
            });

        if ($visitDates->isEmpty()) {
            return 'Sin frecuencia definida';
        }

        $frequencyDays = $visitDates
            ->map(fn ($visitDate) => $visitDate->visit_date->dayOfWeekIso)
            ->unique()
            ->sort()
            ->map(function ($dayNumber) {
                return [
                    1 => 'Lunes',
                    2 => 'Martes',
                    3 => 'Miércoles',
                    4 => 'Jueves',
                    5 => 'Viernes',
                    6 => 'Sábado',
                    7 => 'Domingo',
                ][$dayNumber] ?? '';
            })
            ->filter()
            ->implode(', ');

        return $frequencyDays ?: 'Sin frecuencia definida';
    }

    public function styles(Worksheet $sheet)
    {
        // Estilo para el encabezado
        $headerRange = 'A1:'.$sheet->getHighestColumn().'1';
        $sheet->getStyle($headerRange)->applyFromArray([
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

        // Centrar columna POS ID
        $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        return $sheet;
    }
}
