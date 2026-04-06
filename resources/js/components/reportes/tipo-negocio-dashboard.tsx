import { useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Crown, Percent, Scale, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function operatorDotColor(color?: string | null): string {
    return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#6366f1';
}

interface BtRow {
    operator_id: number;
    name: string;
    color?: string | null;
    sale_mode: 'prepago' | 'pospago';
    business_type: string;
}

interface MapPdvLite {
    id: number;
    zonal_id?: number | null;
    zonal_name?: string | null;
    bt_operators: BtRow[];
}

export interface TipoNegocioDashboardProps {
    filteredPdvs: MapPdvLite[];
    saleModes: { prepago: boolean; pospago: boolean };
    selectedOperatorIds: number[];
    loading: boolean;
    className?: string;
}

function filterBtRows(
    rows: BtRow[],
    saleModes: { prepago: boolean; pospago: boolean },
    operatorIds: number[]
): BtRow[] {
    return rows.filter((row) => {
        if (!saleModes[row.sale_mode]) return false;
        if (operatorIds.length > 0 && !operatorIds.includes(row.operator_id)) return false;
        return true;
    });
}

function groupPdvsByZonalId(pdvs: MapPdvLite[]): Map<number, { zonalName: string; pdvs: MapPdvLite[] }> {
    const m = new Map<number, { zonalName: string; pdvs: MapPdvLite[] }>();
    for (const p of pdvs) {
        const zid = p.zonal_id;
        if (zid == null || Number.isNaN(Number(zid))) continue;
        const zonalName = (p.zonal_name && String(p.zonal_name).trim()) || `Zonal ${zid}`;
        if (!m.has(zid)) {
            m.set(zid, { zonalName, pdvs: [] });
        }
        m.get(zid)!.pdvs.push(p);
    }
    return m;
}

function countByOperator(
    pdvs: MapPdvLite[],
    saleModes: { prepago: boolean; pospago: boolean },
    operatorIds: number[]
): Map<number, { name: string; color: string; count: number }> {
    const counts = new Map<number, { name: string; color: string; count: number }>();
    for (const pdv of pdvs) {
        for (const row of filterBtRows(pdv.bt_operators ?? [], saleModes, operatorIds)) {
            const prev = counts.get(row.operator_id) ?? {
                count: 0,
                name: row.name,
                color: operatorDotColor(row.color),
            };
            counts.set(row.operator_id, {
                count: prev.count + 1,
                name: row.name,
                color: operatorDotColor(row.color),
            });
        }
    }
    return counts;
}

const chartFont = { family: 'ui-sans-serif, system-ui, sans-serif' };

const baseChartOptions: ChartOptions<'bar' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { font: chartFont, boxWidth: 12 },
        },
        tooltip: {
            bodyFont: chartFont,
            titleFont: chartFont,
        },
    },
};

export function TipoNegocioDashboard({
    filteredPdvs,
    saleModes,
    selectedOperatorIds,
    loading,
    className,
}: TipoNegocioDashboardProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const analytics = useMemo(() => {
        const opCounts = countByOperator(filteredPdvs, saleModes, selectedOperatorIds);
        let totalAssignments = 0;
        for (const v of opCounts.values()) totalAssignments += v.count;

        const sortedOps = [...opCounts.entries()]
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.count - a.count || a.id - b.id);

        const first = sortedOps[0];
        const second = sortedOps[1];
        const leaderGap =
            first && second && totalAssignments > 0
                ? {
                      assignments: first.count - second.count,
                      pp:
                          (first.count / totalAssignments - second.count / totalAssignments) *
                          100,
                  }
                : first && !second && totalAssignments > 0
                  ? { assignments: first.count, pp: 100 }
                  : null;

        let prepago = 0;
        let pospago = 0;
        const byOpMode = new Map<number, { prepago: number; pospago: number; name: string; color: string }>();
        for (const pdv of filteredPdvs) {
            for (const row of filterBtRows(pdv.bt_operators ?? [], saleModes, selectedOperatorIds)) {
                if (row.sale_mode === 'prepago') prepago += 1;
                else pospago += 1;
                const cur =
                    byOpMode.get(row.operator_id) ?? {
                        prepago: 0,
                        pospago: 0,
                        name: row.name,
                        color: operatorDotColor(row.color),
                    };
                if (row.sale_mode === 'prepago') cur.prepago += 1;
                else cur.pospago += 1;
                byOpMode.set(row.operator_id, cur);
            }
        }

        const businessTypeCounts = new Map<string, number>();
        for (const pdv of filteredPdvs) {
            for (const row of filterBtRows(pdv.bt_operators ?? [], saleModes, selectedOperatorIds)) {
                const k = row.business_type || 'Sin tipo';
                businessTypeCounts.set(k, (businessTypeCounts.get(k) ?? 0) + 1);
            }
        }
        const topTypes = [...businessTypeCounts.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const zonalLeaders: { name: string; winner: string; share: number; total: number; color: string }[] = [];
        const groups = groupPdvsByZonalId(filteredPdvs);
        for (const [, g] of groups) {
            const zCounts = countByOperator(g.pdvs, saleModes, selectedOperatorIds);
            let zTotal = 0;
            for (const v of zCounts.values()) zTotal += v.count;
            if (zTotal === 0) continue;
            const zSorted = [...zCounts.entries()]
                .map(([id, v]) => ({ id, ...v }))
                .sort((a, b) => b.count - a.count || a.id - b.id);
            const w = zSorted[0];
            if (!w) continue;
            zonalLeaders.push({
                name: g.zonalName,
                winner: w.name,
                share: (w.count / zTotal) * 100,
                total: zTotal,
                color: w.color,
            });
        }
        zonalLeaders.sort((a, b) => b.total - a.total);
        const topZonals = zonalLeaders.slice(0, 12);

        return {
            totalAssignments,
            sortedOps,
            first,
            leaderGap,
            prepago,
            pospago,
            byOpMode,
            topTypes,
            topZonals,
        };
    }, [filteredPdvs, saleModes, selectedOperatorIds]);

    const doughnutData = useMemo(() => {
        const { sortedOps, totalAssignments } = analytics;
        if (totalAssignments === 0) return null;
        return {
            labels: sortedOps.map((o) => o.name),
            datasets: [
                {
                    data: sortedOps.map((o) => o.count),
                    backgroundColor: sortedOps.map((o) => o.color),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    }, [analytics]);

    const barByOperatorData = useMemo(() => {
        const { sortedOps } = analytics;
        if (sortedOps.length === 0) return null;
        return {
            labels: sortedOps.map((o) => o.name),
            datasets: [
                {
                    label: 'Asignaciones',
                    data: sortedOps.map((o) => o.count),
                    backgroundColor: sortedOps.map((o) => o.color),
                    borderRadius: 6,
                },
            ],
        };
    }, [analytics]);

    const stackedModalidadData = useMemo(() => {
        const { sortedOps, byOpMode } = analytics;
        if (sortedOps.length === 0) return null;
        const labels = sortedOps.map((o) => o.name);
        const prep = sortedOps.map((o) => byOpMode.get(o.id)?.prepago ?? 0);
        const pos = sortedOps.map((o) => byOpMode.get(o.id)?.pospago ?? 0);
        return {
            labels,
            datasets: [
                {
                    label: 'Prepago',
                    data: prep,
                    backgroundColor: 'rgba(245, 158, 11, 0.85)',
                    borderRadius: 4,
                },
                {
                    label: 'Pospago',
                    data: pos,
                    backgroundColor: 'rgba(124, 58, 237, 0.85)',
                    borderRadius: 4,
                },
            ],
        };
    }, [analytics]);

    const businessTypesBarData = useMemo(() => {
        const { topTypes } = analytics;
        if (topTypes.length === 0) return null;
        return {
            labels: topTypes.map((t) =>
                t.label.length > 22 ? `${t.label.slice(0, 20)}…` : t.label
            ),
            datasets: [
                {
                    label: 'Asignaciones',
                    data: topTypes.map((t) => t.count),
                    backgroundColor: 'rgba(219, 39, 119, 0.75)',
                    borderRadius: 4,
                },
            ],
        };
    }, [analytics]);

    const zonalShareData = useMemo(() => {
        const { topZonals } = analytics;
        if (topZonals.length === 0) return null;
        return {
            labels: topZonals.map((z) => (z.name.length > 18 ? `${z.name.slice(0, 16)}…` : z.name)),
            datasets: [
                {
                    label: '% cuota del líder en el zonal',
                    data: topZonals.map((z) => Number(z.share.toFixed(1))),
                    backgroundColor: topZonals.map((z) => z.color),
                    borderRadius: 4,
                },
            ],
        };
    }, [analytics]);

    if (!mounted || loading) {
        return (
            <div className={cn('border-t border-gray-200 bg-white px-3 py-4 sm:px-4 lg:px-6', className)}>
                <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-pink-600" />
                    <h3 className="text-base font-semibold text-gray-900">Panel de análisis</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-64 rounded-lg" />
                    <Skeleton className="h-64 rounded-lg" />
                </div>
            </div>
        );
    }

    if (analytics.totalAssignments === 0) {
        return (
            <div className={cn('border-t border-gray-200 bg-slate-50/80 px-3 py-6 sm:px-4 lg:px-6', className)}>
                <div className="flex items-center gap-2 text-gray-700">
                    <BarChart3 className="h-5 w-5 text-pink-600" />
                    <h3 className="text-base font-semibold">Panel de análisis</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                    No hay asignaciones con los filtros actuales (modalidad y operadores). Ajusta los filtros del mapa
                    para ver cuotas y rankings.
                </p>
            </div>
        );
    }

    const doughnutOptions: ChartOptions<'doughnut'> = {
        ...baseChartOptions,
        plugins: {
            ...baseChartOptions.plugins,
            legend: { position: 'right', labels: { font: chartFont, boxWidth: 12 } },
            tooltip: {
                ...baseChartOptions.plugins?.tooltip,
                callbacks: {
                    label: (ctx) => {
                        const v = ctx.raw as number;
                        const pct = analytics.totalAssignments
                            ? ((v / analytics.totalAssignments) * 100).toFixed(1)
                            : '0';
                        return ` ${ctx.label}: ${v} (${pct}%)`;
                    },
                },
            },
        },
    };

    const barOptions: ChartOptions<'bar'> = {
        ...baseChartOptions,
        scales: {
            x: {
                ticks: { font: chartFont, maxRotation: 45, minRotation: 0 },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { font: chartFont, precision: 0 },
            },
        },
    };

    const horizontalBarOptions: ChartOptions<'bar'> = {
        ...baseChartOptions,
        indexAxis: 'y' as const,
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    font: chartFont,
                    callback: (v) => `${v}%`,
                },
            },
            y: {
                ticks: { font: chartFont },
            },
        },
    };

    const stackedOptions: ChartOptions<'bar'> = {
        ...barOptions,
        scales: {
            ...barOptions.scales,
            x: { ...barOptions.scales?.x, stacked: true },
            y: { ...barOptions.scales?.y, stacked: true },
        },
    };

    return (
        <div className={cn('border-t border-gray-200 bg-gradient-to-b from-slate-50/90 to-white px-3 py-4 sm:px-4 lg:px-6', className)}>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 shrink-0 text-pink-600" />
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Panel de análisis</h3>
                        <p className="text-xs text-gray-600 sm:text-sm">
                            Resumen de asignaciones activas según modalidad y operadores del mapa (mismos criterios que
                            la lista de PDVs).
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-pink-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total asignaciones</p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                                {analytics.totalAssignments}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">Filas prepago/pospago en PDVs filtrados</p>
                        </div>
                        <Scale className="h-8 w-8 text-pink-200" />
                    </div>
                </Card>
                <Card className="border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Líder</p>
                            {analytics.first ? (
                                <>
                                    <p className="mt-1 truncate text-lg font-bold text-gray-900">{analytics.first.name}</p>
                                    <p className="text-xs text-gray-600">
                                        {((analytics.first.count / analytics.totalAssignments) * 100).toFixed(1)}% de la
                                        cuota
                                    </p>
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-gray-500">—</p>
                            )}
                        </div>
                        <Crown className="h-8 w-8 shrink-0 text-amber-300" />
                    </div>
                </Card>
                <Card className="border-violet-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ventaja vs 2.º</p>
                            {analytics.leaderGap && analytics.first && secondPlaceLabel(analytics) ? (
                                <>
                                    <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                                        +{analytics.leaderGap.assignments}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        +{analytics.leaderGap.pp.toFixed(1)} pp frente a {secondPlaceLabel(analytics)}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">Un solo operador con presencia</p>
                            )}
                        </div>
                        <TrendingUp className="h-8 w-8 text-violet-300" />
                    </div>
                </Card>
                <Card className="border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Modalidad</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                Prepago {analytics.prepago} · Pospago {analytics.pospago}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-600">
                                {analytics.totalAssignments > 0
                                    ? `${((analytics.prepago / analytics.totalAssignments) * 100).toFixed(0)}% prep. / ${((analytics.pospago / analytics.totalAssignments) * 100).toFixed(0)}% pos.`
                                    : ''}
                            </p>
                        </div>
                        <Percent className="h-8 w-8 text-emerald-300" />
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4 shadow-sm">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Cuota por operador</h4>
                    <p className="mb-3 text-xs text-gray-500">Distribución de asignaciones: quién concentra más checks.</p>
                    <div className="h-[260px]">{doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}</div>
                </Card>
                <Card className="p-4 shadow-sm">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Asignaciones por operador</h4>
                    <p className="mb-3 text-xs text-gray-500">Comparación en volumen absoluto.</p>
                    <div className="h-[260px]">{barByOperatorData && <Bar data={barByOperatorData} options={barOptions} />}</div>
                </Card>
                <Card className="p-4 shadow-sm lg:col-span-2">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Prepago vs pospago por operador</h4>
                    <p className="mb-3 text-xs text-gray-500">Desglose de modalidad dentro de cada operador.</p>
                    <div className="h-[280px]">
                        {stackedModalidadData && <Bar data={stackedModalidadData} options={stackedOptions} />}
                    </div>
                </Card>
                <Card className="p-4 shadow-sm">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Tipos de negocio (top)</h4>
                    <p className="mb-3 text-xs text-gray-500">Donde hay más asignaciones registradas.</p>
                    <div className="h-[260px]">
                        {businessTypesBarData && <Bar data={businessTypesBarData} options={barOptions} />}
                    </div>
                </Card>
                <Card className="p-4 shadow-sm">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Dominancia del líder por zonal</h4>
                    <p className="mb-3 text-xs text-gray-500">
                        % de asignaciones que corresponden al operador líder en cada zonal (hasta 12 con más volumen).
                    </p>
                    <div className="h-[280px]">
                        {zonalShareData && <Bar data={zonalShareData} options={horizontalBarOptions} />}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function secondPlaceLabel(analytics: {
    sortedOps: { name: string; count: number; id: number }[];
    first?: { name: string; count: number; id: number };
}): string | null {
    const second = analytics.sortedOps[1];
    return second ? second.name : null;
}
