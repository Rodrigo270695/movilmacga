<?php

namespace App\Http\Controllers\Reportes;

use App\Exports\PdvFrecuenciaVisitasExport;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Circuit;
use App\Models\Pdv;
use App\Models\Route;
use App\Models\Zonal;
use App\Traits\HasBusinessScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PdvFrecuenciaVisitasController extends Controller
{
    use HasBusinessScope;

    /**
     * Reporte Integratel: Q de visitas programadas por PDV (semana → mes).
     * 3 visitas/semana = 12 visitas/mes.
     */
    public function index(Request $request)
    {
        Carbon::setLocale('es');
        $lima = now()->setTimezone('America/Lima');
        $year = (int) ($request->year ?: $lima->year);
        $month = (int) ($request->month ?: $lima->month);
        $year = max(2020, min(2100, $year));
        $month = max(1, min(12, $month));

        $start = Carbon::create($year, $month, 1, 0, 0, 0, 'America/Lima')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $routeStats = $this->routeFrequencyStats($start, $end);
        $pdvsQuery = $this->basePdvsQuery($request);

        $chartData = $this->buildChartData(clone $pdvsQuery, $routeStats, $start, $end);
        $kpis = $this->buildKpis($chartData);

        $perPage = (int) $request->get('per_page', 50);
        $pdvs = $pdvsQuery
            ->with([
                'route:id,name,code,circuit_id',
                'route.circuit:id,name,code,zonal_id',
                'route.circuit.zonal:id,name,business_id',
                'route.circuit.zonal.business:id,name',
            ])
            ->orderBy('point_name')
            ->paginate($perPage)
            ->withQueryString();

        $pdvs->getCollection()->transform(function (Pdv $pdv) use ($routeStats) {
            $stats = $routeStats->get($pdv->route_id);
            $visitsWeek = (int) ($stats->visits_week ?? 0);
            $pdv->visits_week = $visitsWeek;
            $pdv->visits_month = $visitsWeek * 4;
            $pdv->programmed_month = (int) ($stats->programmed_month ?? 0);
            $pdv->visit_days = $stats->visit_days ?? '';

            return $pdv;
        });

        return Inertia::render('reportes/frecuencia-visitas-pdv/index', [
            'pdvs' => $pdvs,
            'kpis' => $kpis,
            'charts' => $chartData,
            'filtros' => [
                'year' => (string) $year,
                'month' => (string) $month,
                'business_id' => $request->business_id,
                'zonal_id' => $request->zonal_id,
                'circuit_id' => $request->circuit_id,
                'route_id' => $request->route_id,
                'pdv_status' => $this->resolvedPdvStatus($request),
                'per_page' => (string) $perPage,
            ],
            'opciones' => $this->filterOptions($request),
            'periodo' => [
                'label' => $start->translatedFormat('F Y'),
                'start' => $start->format('d/m/Y'),
                'end' => $end->format('d/m/Y'),
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    /**
     * Vista limpia para imprimir / guardar como PDF.
     */
    public function print(Request $request)
    {
        Carbon::setLocale('es');
        $lima = now()->setTimezone('America/Lima');
        $year = (int) ($request->year ?: $lima->year);
        $month = (int) ($request->month ?: $lima->month);
        $year = max(2020, min(2100, $year));
        $month = max(1, min(12, $month));

        $start = Carbon::create($year, $month, 1, 0, 0, 0, 'America/Lima')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $routeStats = $this->routeFrequencyStats($start, $end);
        $pdvsQuery = $this->basePdvsQuery($request);
        $chartData = $this->buildChartData(clone $pdvsQuery, $routeStats, $start, $end);
        $kpis = $this->buildKpis($chartData);

        return Inertia::render('reportes/frecuencia-visitas-pdv/print', [
            'kpis' => $kpis,
            'charts' => $chartData,
            'periodo' => [
                'label' => $start->locale('es')->translatedFormat('F Y'),
                'start' => $start->format('d/m/Y'),
                'end' => $end->format('d/m/Y'),
            ],
            'alcance' => $this->scopeLabel($request),
            'generado' => now('America/Lima')->format('d/m/Y H:i'),
        ]);
    }

    public function export(Request $request)
    {
        $lima = now()->setTimezone('America/Lima');
        $year = (int) ($request->year ?: $lima->year);
        $month = (int) ($request->month ?: $lima->month);
        $start = Carbon::create($year, $month, 1, 0, 0, 0, 'America/Lima')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $routeStats = $this->routeFrequencyStats($start, $end);
        $pdvs = $this->basePdvsQuery($request)
            ->with([
                'route:id,name,code,circuit_id',
                'route.circuit:id,name,code,zonal_id',
                'route.circuit.zonal:id,name,business_id',
                'route.circuit.zonal.business:id,name',
                'route.circuit.userCircuits' => fn ($q) => $q->where('is_active', true),
                'route.circuit.userCircuits.user:id,first_name,last_name,name',
            ])
            ->orderBy('point_name')
            ->get()
            ->map(function (Pdv $pdv) use ($routeStats) {
                $stats = $routeStats->get($pdv->route_id);
                $visitsWeek = (int) ($stats->visits_week ?? 0);
                $pdv->visits_week = $visitsWeek;
                $pdv->visits_month = $visitsWeek * 4;
                $pdv->programmed_month = (int) ($stats->programmed_month ?? 0);
                $pdv->visit_days = $stats->visit_days ?? '';

                return $pdv;
            });

        $fileName = sprintf(
            'frecuencia_visitas_pdv_%04d_%02d_%s.xlsx',
            $year,
            $month,
            now()->format('Y-m-d_H-i-s')
        );

        return Excel::download(new PdvFrecuenciaVisitasExport($pdvs), $fileName);
    }

    private function resolvedPdvStatus(Request $request): string
    {
        $status = (string) $request->get('pdv_status', 'vende');

        return in_array($status, ['vende', 'no vende', 'todos'], true) ? $status : 'vende';
    }

    private function basePdvsQuery(Request $request)
    {
        $query = Pdv::query()->whereNotNull('pdvs.route_id');

        $pdvStatus = $this->resolvedPdvStatus($request);
        if ($pdvStatus !== 'todos') {
            $query->where('pdvs.status', $pdvStatus);
        } else {
            $query->whereIn('pdvs.status', ['vende', 'no vende']);
        }

        // Solo zonales activas: las desactivadas no entran al reporte ni a los gráficos
        $query->whereHas('route.circuit.zonal', function ($q) {
            $q->where('status', true);
        });

        $query = $this->applyFullScope($query, 'route.circuit.zonal.business', 'route.circuit.zonal');

        if ($request->filled('business_id')) {
            $query->whereHas('route.circuit.zonal', function ($q) use ($request) {
                $q->where('business_id', $request->business_id)
                    ->where('status', true);
            });
        }

        if ($request->filled('zonal_id')) {
            $query->whereHas('route.circuit.zonal', function ($q) use ($request) {
                $q->where('id', $request->zonal_id)
                    ->where('status', true);
            });
        }

        if ($request->filled('circuit_id')) {
            $query->whereHas('route', function ($q) use ($request) {
                $q->where('circuit_id', $request->circuit_id);
            });
        }

        if ($request->filled('route_id')) {
            $query->where('pdvs.route_id', $request->route_id);
        }

        return $query;
    }

    /**
     * Visitas/semana = días de semana únicos programados en el mes.
     * Visitas/mes Integratel = visitas/semana × 4.
     */
    private function routeFrequencyStats(Carbon $start, Carbon $end)
    {
        return DB::table('route_visit_dates as rvd')
            ->join('routes as r', 'rvd.route_id', '=', 'r.id')
            ->join('circuits as c', 'r.circuit_id', '=', 'c.id')
            ->join('zonales as z', 'c.zonal_id', '=', 'z.id')
            ->where('rvd.is_active', true)
            ->where('r.status', true)
            ->where('z.status', true)
            ->whereDate('rvd.visit_date', '>=', $start->toDateString())
            ->whereDate('rvd.visit_date', '<=', $end->toDateString())
            ->where(function ($q) {
                $q->whereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('circuit_frequencies as cf')
                        ->whereColumn('cf.circuit_id', 'r.circuit_id');
                })->orWhereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('circuit_frequencies as cf')
                        ->whereColumn('cf.circuit_id', 'r.circuit_id')
                        ->whereRaw("cf.day_of_week = ELT(DAYOFWEEK(rvd.visit_date), 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')");
                });
            })
            ->groupBy('rvd.route_id')
            ->selectRaw("
                rvd.route_id,
                COUNT(*) as programmed_month,
                COUNT(DISTINCT DAYOFWEEK(rvd.visit_date)) as visits_week,
                GROUP_CONCAT(DISTINCT ELT(DAYOFWEEK(rvd.visit_date), 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb')
                    ORDER BY DAYOFWEEK(rvd.visit_date) SEPARATOR ', ') as visit_days
            ")
            ->get()
            ->keyBy('route_id');
    }

    private function buildChartData($pdvsQuery, $routeStats, Carbon $start, Carbon $end): array
    {
        $countsByRoute = (clone $pdvsQuery)
            ->selectRaw('pdvs.route_id, COUNT(*) as cnt')
            ->groupBy('pdvs.route_id')
            ->pluck('cnt', 'route_id');

        $byWeek = [0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $byZonal = [];
        $byCircuit = [];
        $totalPdvs = 0;
        $weightedWeek = 0;

        $zonalRows = (clone $pdvsQuery)
            ->join('routes', 'pdvs.route_id', '=', 'routes.id')
            ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
            ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
            ->where('zonales.status', true)
            ->selectRaw('zonales.id as zonal_id, zonales.name as zonal_name, circuits.id as circuit_id, circuits.name as circuit_name, pdvs.route_id, COUNT(pdvs.id) as cnt')
            ->groupBy('zonales.id', 'zonales.name', 'circuits.id', 'circuits.name', 'pdvs.route_id')
            ->get();

        foreach ($zonalRows as $row) {
            $week = (int) ($routeStats->get($row->route_id)->visits_week ?? 0);
            $cnt = (int) $row->cnt;
            $totalPdvs += $cnt;
            $weightedWeek += $week * $cnt;

            $bucket = $week >= 5 ? 5 : $week;
            $byWeek[$bucket] = ($byWeek[$bucket] ?? 0) + $cnt;

            $zKey = $row->zonal_id;
            if (! isset($byZonal[$zKey])) {
                $byZonal[$zKey] = [
                    'id' => (int) $row->zonal_id,
                    'name' => $row->zonal_name,
                    'pdvs' => 0,
                    'visits_week_sum' => 0,
                    'visits_month_sum' => 0,
                ];
            }
            $byZonal[$zKey]['pdvs'] += $cnt;
            $byZonal[$zKey]['visits_week_sum'] += $week * $cnt;
            $byZonal[$zKey]['visits_month_sum'] += ($week * 4) * $cnt;

            $cKey = $row->circuit_id;
            if (! isset($byCircuit[$cKey])) {
                $byCircuit[$cKey] = [
                    'id' => (int) $row->circuit_id,
                    'name' => $row->circuit_name,
                    'pdvs' => 0,
                    'visits_week_sum' => 0,
                    'visits_month_sum' => 0,
                ];
            }
            $byCircuit[$cKey]['pdvs'] += $cnt;
            $byCircuit[$cKey]['visits_week_sum'] += $week * $cnt;
            $byCircuit[$cKey]['visits_month_sum'] += ($week * 4) * $cnt;
        }

        if ($totalPdvs === 0 && $countsByRoute->isNotEmpty()) {
            foreach ($countsByRoute as $routeId => $cnt) {
                $week = (int) ($routeStats->get($routeId)->visits_week ?? 0);
                $cnt = (int) $cnt;
                $totalPdvs += $cnt;
                $weightedWeek += $week * $cnt;
                $bucket = $week >= 5 ? 5 : $week;
                $byWeek[$bucket] = ($byWeek[$bucket] ?? 0) + $cnt;
            }
        }

        $byWeekday = $this->weekdayDistribution($pdvsQuery, $start, $end);

        $formatGroup = function (array $groups) {
            return collect($groups)
                ->map(function ($g) {
                    $pdvs = $g['pdvs'] ?: 1;

                    return [
                        'id' => $g['id'],
                        'name' => $g['name'],
                        'pdvs' => $g['pdvs'],
                        'avg_week' => round($g['visits_week_sum'] / $pdvs, 1),
                        'avg_month' => round($g['visits_month_sum'] / $pdvs, 1),
                        'q_month' => $g['visits_month_sum'],
                    ];
                })
                ->sortByDesc('pdvs')
                ->values()
                ->take(12)
                ->all();
        };

        return [
            'total_pdvs' => $totalPdvs,
            'avg_week' => $totalPdvs > 0 ? round($weightedWeek / $totalPdvs, 1) : 0,
            'avg_month' => $totalPdvs > 0 ? round(($weightedWeek / $totalPdvs) * 4, 1) : 0,
            'q_month_total' => $weightedWeek * 4,
            'by_week' => [
                ['key' => '0', 'label' => 'Sin visita', 'pdvs' => $byWeek[0] ?? 0],
                ['key' => '1', 'label' => '1 vez / sem.', 'pdvs' => $byWeek[1] ?? 0, 'month' => 4],
                ['key' => '2', 'label' => '2 veces / sem.', 'pdvs' => $byWeek[2] ?? 0, 'month' => 8],
                ['key' => '3', 'label' => '3 veces / sem.', 'pdvs' => $byWeek[3] ?? 0, 'month' => 12],
                ['key' => '4', 'label' => '4 veces / sem.', 'pdvs' => $byWeek[4] ?? 0, 'month' => 16],
                ['key' => '5', 'label' => '5+ veces / sem.', 'pdvs' => $byWeek[5] ?? 0, 'month' => 20],
            ],
            'by_zonal' => $formatGroup($byZonal),
            'by_circuit' => $formatGroup($byCircuit),
            'by_weekday' => $byWeekday,
        ];
    }

    private function weekdayDistribution($pdvsQuery, Carbon $start, Carbon $end): array
    {
        $pdvIds = (clone $pdvsQuery)->pluck('pdvs.id');
        $labels = [1 => 'Dom', 2 => 'Lun', 3 => 'Mar', 4 => 'Mié', 5 => 'Jue', 6 => 'Vie', 7 => 'Sáb'];
        $base = collect($labels)->map(fn ($label, $dow) => [
            'dow' => $dow,
            'label' => $label,
            'pdvs' => 0,
        ])->all();

        if ($pdvIds->isEmpty()) {
            return array_values($base);
        }

        $rows = DB::table('pdvs')
            ->join('route_visit_dates as rvd', 'rvd.route_id', '=', 'pdvs.route_id')
            ->join('routes as r', 'rvd.route_id', '=', 'r.id')
            ->join('circuits as c', 'r.circuit_id', '=', 'c.id')
            ->join('zonales as z', 'c.zonal_id', '=', 'z.id')
            ->whereIn('pdvs.id', $pdvIds)
            ->where('z.status', true)
            ->where('rvd.is_active', true)
            ->where('r.status', true)
            ->whereDate('rvd.visit_date', '>=', $start->toDateString())
            ->whereDate('rvd.visit_date', '<=', $end->toDateString())
            ->where(function ($q) {
                $q->whereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('circuit_frequencies as cf')
                        ->whereColumn('cf.circuit_id', 'r.circuit_id');
                })->orWhereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('circuit_frequencies as cf')
                        ->whereColumn('cf.circuit_id', 'r.circuit_id')
                        ->whereRaw("cf.day_of_week = ELT(DAYOFWEEK(rvd.visit_date), 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')");
                });
            })
            ->selectRaw('DAYOFWEEK(rvd.visit_date) as dow, COUNT(DISTINCT pdvs.id) as pdvs')
            ->groupBy('dow')
            ->get();

        foreach ($rows as $row) {
            $dow = (int) $row->dow;
            if (isset($base[$dow])) {
                $base[$dow]['pdvs'] = (int) $row->pdvs;
            }
        }

        // Orden Lunes → Domingo
        return [
            $base[2], $base[3], $base[4], $base[5], $base[6], $base[7], $base[1],
        ];
    }

    private function buildKpis(array $chartData): array
    {
        $withVisits = $chartData['total_pdvs'] - (($chartData['by_week'][0]['pdvs'] ?? 0));

        return [
            'total_pdvs' => $chartData['total_pdvs'],
            'pdvs_con_frecuencia' => max(0, $withVisits),
            'avg_week' => $chartData['avg_week'],
            'avg_month' => $chartData['avg_month'],
            'q_month_total' => $chartData['q_month_total'],
        ];
    }

    private function scopeLabel(Request $request): string
    {
        $parts = [];

        if ($request->filled('business_id')) {
            $name = Business::find($request->business_id)?->name;
            if ($name) {
                $parts[] = 'Negocio: '.$name;
            }
        }
        if ($request->filled('zonal_id')) {
            $name = Zonal::find($request->zonal_id)?->name;
            if ($name) {
                $parts[] = 'Zonal: '.$name;
            }
        }
        if ($request->filled('circuit_id')) {
            $name = Circuit::find($request->circuit_id)?->name;
            if ($name) {
                $parts[] = 'Circuito: '.$name;
            }
        }
        if ($request->filled('route_id')) {
            $name = Route::find($request->route_id)?->name;
            if ($name) {
                $parts[] = 'Ruta: '.$name;
            }
        }

        $status = $this->resolvedPdvStatus($request);
        $parts[] = match ($status) {
            'no vende' => 'Estado PDV: No vende',
            'todos' => 'Estado PDV: Vende y no vende',
            default => 'Estado PDV: Vende',
        };

        return implode(' · ', $parts);
    }

    private function filterOptions(Request $request): array
    {
        Carbon::setLocale('es');
        $scope = $this->getBusinessScope();

        $businessesQuery = Business::where('status', true);
        $zonalesQuery = Zonal::with('business:id,name')->where('status', true);
        $circuitsQuery = Circuit::with('zonal:id,name')
            ->where('status', true)
            ->whereHas('zonal', fn ($q) => $q->where('status', true));
        $routesQuery = Route::where('status', true)
            ->whereHas('circuit.zonal', fn ($q) => $q->where('status', true));

        if (! $scope['is_admin']) {
            if ($scope['has_business_restriction'] && ! empty($scope['business_ids'])) {
                $businessesQuery->whereIn('id', $scope['business_ids']);
                $zonalesQuery->whereIn('business_id', $scope['business_ids']);
                $circuitsQuery->whereHas('zonal', fn ($q) => $q->whereIn('business_id', $scope['business_ids']));
                $routesQuery->whereHas('circuit.zonal', fn ($q) => $q->whereIn('business_id', $scope['business_ids']));
            }
            if ($scope['has_zonal_restriction'] && ! empty($scope['zonal_ids'])) {
                $zonalesQuery->whereIn('id', $scope['zonal_ids']);
                $circuitsQuery->whereIn('zonal_id', $scope['zonal_ids']);
                $routesQuery->whereHas('circuit', fn ($q) => $q->whereIn('zonal_id', $scope['zonal_ids']));
            }
        }

        $businesses = $businessesQuery->orderBy('name')->get(['id', 'name']);
        $allZonales = $zonalesQuery->orderBy('name')->get(['id', 'name', 'business_id']);
        $allCircuits = $circuitsQuery->orderBy('name')->get(['id', 'name', 'code', 'zonal_id']);
        $allRoutes = $routesQuery->orderBy('name')->get(['id', 'name', 'code', 'circuit_id']);

        $zonales = $allZonales;
        $circuits = $allCircuits;
        $routes = $allRoutes;

        if ($request->filled('business_id')) {
            $zonales = $allZonales->where('business_id', (int) $request->business_id)->values();
        }
        if ($request->filled('zonal_id')) {
            $circuits = $allCircuits->where('zonal_id', (int) $request->zonal_id)->values();
        }
        if ($request->filled('circuit_id')) {
            $routes = $allRoutes->where('circuit_id', (int) $request->circuit_id)->values();
        }

        $months = [];
        for ($i = 1; $i <= 12; $i++) {
            $months[] = [
                'value' => (string) $i,
                'label' => Carbon::create(null, $i, 1)->locale('es')->translatedFormat('F'),
            ];
        }

        $currentYear = (int) now('America/Lima')->year;
        $years = [];
        for ($y = $currentYear; $y >= $currentYear - 4; $y--) {
            $years[] = ['value' => (string) $y, 'label' => (string) $y];
        }

        return [
            'businesses' => $businesses,
            'allZonales' => $allZonales->values(),
            'allCircuits' => $allCircuits->values(),
            'allRoutes' => $allRoutes->values(),
            'zonales' => $zonales instanceof \Illuminate\Support\Collection ? $zonales->values() : $zonales,
            'circuits' => $circuits instanceof \Illuminate\Support\Collection ? $circuits->values() : $circuits,
            'routes' => $routes instanceof \Illuminate\Support\Collection ? $routes->values() : $routes,
            'months' => $months,
            'years' => $years,
        ];
    }
}
