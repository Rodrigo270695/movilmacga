import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import type { ChartPayload } from '@/components/reportes/frecuencia-visitas-pdv/frecuencia-charts';

interface Props {
    kpis: {
        total_pdvs: number;
        pdvs_con_frecuencia: number;
        avg_week: number;
        avg_month: number;
        q_month_total: number;
    };
    charts: ChartPayload;
    periodo: { label: string; start: string; end: string };
    alcance: string;
    generado: string;
}

function nInt(value: number) {
    return Math.round(value).toLocaleString('es-PE');
}

function nDec(value: number) {
    return value.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function pct(part: number, total: number) {
    if (total <= 0) return 0;
    return Math.round((part / total) * 100);
}

function BarRow({ label, value, max, extra }: { label: string; value: number; max: number; extra?: string }) {
    const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;

    return (
        <div className="grid grid-cols-[140px_1fr_70px] items-center gap-2 py-1.5">
            <div className="text-[11px] text-gray-700 truncate">{label}</div>
            <div className="h-4 bg-slate-100 rounded-sm overflow-hidden">
                <div className="h-full bg-blue-600 rounded-sm" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[11px] font-semibold text-gray-900 text-right">
                {nInt(value)}{extra ? <span className="block text-[9px] font-normal text-gray-500">{extra}</span> : null}
            </div>
        </div>
    );
}

export default function FrecuenciaVisitasPdvPrint({ kpis, charts, periodo, alcance, generado }: Props) {
    useEffect(() => {
        const timer = window.setTimeout(() => window.print(), 400);
        return () => window.clearTimeout(timer);
    }, []);

    const weekRows = charts.by_week.filter((w) => w.key !== '0' || w.pdvs > 0);
    const weekMax = Math.max(...weekRows.map((w) => w.pdvs), 1);
    const weekdayMax = Math.max(...charts.by_weekday.map((d) => d.pdvs), 1);
    const zonalMax = Math.max(...charts.by_zonal.map((z) => z.q_month), 1);
    const once = charts.by_week.find((w) => w.key === '1')?.pdvs ?? 0;
    const twice = charts.by_week.find((w) => w.key === '2')?.pdvs ?? 0;
    const threePlus = charts.by_week.filter((w) => ['3', '4', '5'].includes(w.key)).reduce((s, w) => s + w.pdvs, 0);
    const none = charts.by_week.find((w) => w.key === '0')?.pdvs ?? 0;

    return (
        <>
            <Head title={`Frecuencia visitas PDV — ${periodo.label}`} />
            <style>{`
                @page { size: A4 landscape; margin: 10mm 12mm; }
                html, body { background: #fff !important; }
                @media print {
                    .no-print { display: none !important; }
                    .sheet { box-shadow: none !important; padding: 0 !important; }
                }
            `}</style>

            <div className="min-h-screen bg-slate-200 print:bg-white">
                <div className="no-print sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
                    <Link href="/reportes/frecuencia-visitas-pdv" className="inline-flex">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al reporte
                        </Button>
                    </Link>
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Printer className="w-4 h-4 mr-2" />
                        Guardar como PDF
                    </Button>
                </div>

                <div className="sheet max-w-[1100px] mx-auto my-4 bg-white shadow-lg p-8 print:max-w-none print:my-0 print:shadow-none print:p-0">
                    <header className="border-b-2 border-blue-700 pb-3 mb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-blue-700 font-semibold">MacGa · Integratel</p>
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                    Frecuencia de visitas PDV
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Período: <strong>{periodo.label}</strong> ({periodo.start} al {periodo.end})
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{alcance}</p>
                            </div>
                            <div className="text-right text-[11px] text-gray-500">
                                <p>Generado: {generado}</p>
                                <p className="mt-2 px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs font-medium">
                                    Q mes = visitas/semana × 4
                                </p>
                                <p className="text-[10px] mt-1">Ejemplo: 3/semana = 12/mes</p>
                            </div>
                        </div>
                    </header>

                    <section className="mb-4 text-[11px] bg-blue-50 text-blue-900 rounded px-3 py-2">
                        Así se lee: el porcentaje es la parte de PDVs que se visita 1, 2 o 3+ veces por semana.
                        1 vez/semana = 4 visitas al mes · 2 veces = 8 · 3 veces = 12.
                    </section>

                    <section className="grid grid-cols-4 gap-3 mb-5">
                        <KpiBox
                            label="PDVs activos"
                            value={nInt(kpis.total_pdvs)}
                            hint="Puntos de venta que venden"
                        />
                        <KpiBox
                            label="1 visita / semana"
                            value={`${pct(once, kpis.total_pdvs)}%`}
                            hint={`${nInt(once)} PDVs · 4 visitas al mes`}
                        />
                        <KpiBox
                            label="2 visitas / semana"
                            value={`${pct(twice, kpis.total_pdvs)}%`}
                            hint={`${nInt(twice)} PDVs · 8 visitas al mes`}
                        />
                        <KpiBox
                            label="3 o más / semana"
                            value={`${pct(threePlus, kpis.total_pdvs)}%`}
                            hint={`${nInt(threePlus)} PDVs · 12 o más al mes`}
                        />
                    </section>
                    <p className="text-xs text-gray-600 -mt-3 mb-5">
                        Q Integratel del mes: <strong>{nInt(kpis.q_month_total)}</strong> visitas programadas
                        {none > 0 ? ` · ${pct(none, kpis.total_pdvs)}% sin visita este mes` : ''}.
                    </p>

                    <section className="grid grid-cols-2 gap-6 mb-5">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">
                                PDVs por frecuencia semanal
                            </h2>
                            {weekRows.map((row) => (
                                <BarRow
                                    key={row.key}
                                    label={row.label}
                                    value={row.pdvs}
                                    max={weekMax}
                                    extra={row.month ? `Q mes = ${row.month}` : undefined}
                                />
                            ))}
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">
                                PDVs con visita por día
                            </h2>
                            {charts.by_weekday.map((row) => (
                                <BarRow key={row.dow} label={row.label} value={row.pdvs} max={weekdayMax} />
                            ))}
                        </div>
                    </section>

                    <section className="mb-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">
                            Q mensual por zonal
                        </h2>
                        {charts.by_zonal.length === 0 ? (
                            <p className="text-xs text-gray-500">Sin datos de zonal.</p>
                        ) : (
                            charts.by_zonal.map((z) => (
                                <BarRow
                                    key={z.id}
                                    label={z.name}
                                    value={z.q_month}
                                    max={zonalMax}
                                    extra={`${nInt(z.pdvs)} PDVs · ${nDec(z.avg_week)}/sem`}
                                />
                            ))
                        )}
                    </section>

                    <section className="grid grid-cols-2 gap-6">
                        <table className="w-full text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-blue-700 text-white">
                                    <th className="text-left px-2 py-1.5 font-semibold">Frecuencia</th>
                                    <th className="text-right px-2 py-1.5 font-semibold">PDVs</th>
                                    <th className="text-right px-2 py-1.5 font-semibold">Q / mes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weekRows.map((row, i) => (
                                    <tr key={row.key} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                                        <td className="px-2 py-1.5 border-b border-slate-200">{row.label}</td>
                                        <td className="px-2 py-1.5 border-b border-slate-200 text-right">{nInt(row.pdvs)}</td>
                                        <td className="px-2 py-1.5 border-b border-slate-200 text-right">{row.month ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <table className="w-full text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-blue-700 text-white">
                                    <th className="text-left px-2 py-1.5 font-semibold">Circuito</th>
                                    <th className="text-right px-2 py-1.5 font-semibold">PDVs</th>
                                    <th className="text-right px-2 py-1.5 font-semibold">Q mes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {charts.by_circuit.slice(0, 10).map((c, i) => (
                                    <tr key={c.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                                        <td className="px-2 py-1.5 border-b border-slate-200">{c.name}</td>
                                        <td className="px-2 py-1.5 border-b border-slate-200 text-right">{nInt(c.pdvs)}</td>
                                        <td className="px-2 py-1.5 border-b border-slate-200 text-right">{nInt(c.q_month)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <footer className="mt-6 pt-3 border-t text-[10px] text-gray-500 flex justify-between">
                        <span>Las visitas semanales salen de las fechas programadas de cada ruta en el mes.</span>
                        <span>MacGa · Reporte Integratel</span>
                    </footer>
                </div>
            </div>
        </>
    );
}

function KpiBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            {hint ? <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p> : null}
        </div>
    );
}
