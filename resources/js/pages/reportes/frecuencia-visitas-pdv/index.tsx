import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download, Printer, CalendarDays, Repeat, BarChart3, MapPin } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { Pagination } from '@/components/ui/pagination';
import { FrecuenciaFilters } from '@/components/reportes/frecuencia-visitas-pdv/frecuencia-filters';
import { FrecuenciaCharts, type ChartPayload } from '@/components/reportes/frecuencia-visitas-pdv/frecuencia-charts';
import { FrecuenciaTable } from '@/components/reportes/frecuencia-visitas-pdv/frecuencia-table';

interface Props {
    pdvs: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    kpis: {
        total_pdvs: number;
        pdvs_con_frecuencia: number;
        avg_week: number;
        avg_month: number;
        q_month_total: number;
    };
    charts: ChartPayload;
    filtros: Record<string, string | undefined>;
    opciones: any;
    periodo: {
        label: string;
        start: string;
        end: string;
        year: number;
        month: number;
    };
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reportes', href: '#' },
    { title: 'Frecuencia visitas PDV', href: '/reportes/frecuencia-visitas-pdv' },
];

export default function FrecuenciaVisitasPdvIndex({ pdvs, kpis, charts, filtros, opciones, periodo, flash }: Props) {
    const { addToast } = useToast();
    const pageProps = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = pageProps.auth?.user?.permissions || [];
    const [isExporting, setIsExporting] = useState(false);

    const hasPermission = (permission: string) => userPermissions.includes(permission);

    useEffect(() => {
        if (flash?.success) {
            addToast({ type: 'success', title: '¡Éxito!', message: flash.success, duration: 4000 });
        }
        if (flash?.error) {
            addToast({ type: 'error', title: 'Error', message: flash.error, duration: 5000 });
        }
    }, [flash, addToast]);

    const queryParams = () => {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value && value !== 'todos' && key !== 'per_page') params.set(key, value);
        });
        return params.toString();
    };

    const handleExport = () => {
        if (!hasPermission('reporte-frecuencia-visitas-pdv-exportar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para exportar este reporte.',
                duration: 4000,
            });
            return;
        }
        setIsExporting(true);
        window.location.href = `/reportes/frecuencia-visitas-pdv/exportar?${queryParams()}`;
        setTimeout(() => setIsExporting(false), 1500);
        addToast({
            type: 'success',
            title: 'Exportación iniciada',
            message: 'Se está descargando el Excel de frecuencia de visitas.',
            duration: 3500,
        });
    };

    const handlePrint = () => {
        const params = queryParams();
        const url = `/reportes/frecuencia-visitas-pdv/imprimir${params ? `?${params}` : ''}`;
        window.open(url, '_blank', 'noopener');
    };

    const visitPage = (page: number, perPage?: number) => {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value && value !== 'todos' && key !== 'per_page') params.set(key, value);
        });
        params.set('per_page', String(perPage ?? pdvs.per_page));
        params.set('page', String(page));
        router.visit(`/reportes/frecuencia-visitas-pdv?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Frecuencia de visitas PDV" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                        Frecuencia de visitas PDV
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Q de visitas programadas para Integratel · {periodo.label}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-2 font-medium">
                                        Si un PDV se visita 3 veces por semana, el Q mensual es 12 (3 × 4).
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="cursor-pointer"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Imprimir PDF
                                    </Button>
                                    {hasPermission('reporte-frecuencia-visitas-pdv-exportar') && (
                                        <Button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            {isExporting ? 'Exportando...' : 'Excel'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <HowToRead charts={charts} totalPdvs={kpis.total_pdvs} qMonth={kpis.q_month_total} />

                    <FrecuenciaFilters filtros={filtros} opciones={opciones} />

                    <FrecuenciaCharts charts={charts} />

                    <FrecuenciaTable pdvs={pdvs} />

                    {pdvs.last_page > 1 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 no-print">
                            <Pagination
                                data={{
                                    current_page: pdvs.current_page,
                                    last_page: pdvs.last_page,
                                    total: pdvs.total,
                                    per_page: pdvs.per_page,
                                    from: pdvs.from,
                                    to: pdvs.to,
                                }}
                                onPageChange={(page) => visitPage(page)}
                                onPerPageChange={(perPage) => visitPage(1, perPage)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function pct(part: number, total: number) {
    if (total <= 0) return 0;
    return Math.round((part / total) * 100);
}

function weekCount(charts: ChartPayload, keys: string[]) {
    return charts.by_week
        .filter((row) => keys.includes(row.key))
        .reduce((sum, row) => sum + row.pdvs, 0);
}

function HowToRead({ charts, totalPdvs, qMonth }: { charts: ChartPayload; totalPdvs: number; qMonth: number }) {
    const once = weekCount(charts, ['1']);
    const twice = weekCount(charts, ['2']);
    const threePlus = weekCount(charts, ['3', '4', '5']);
    const none = weekCount(charts, ['0']);

    return (
        <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-900">
                <p className="font-medium">Cómo leer este reporte</p>
                <p className="text-blue-800 mt-1">
                    Cada PDV tiene una frecuencia de visita en su ruta. Si se visita <strong>1 vez por semana</strong>,
                    en el mes son <strong>4 visitas</strong>. Si son 2 por semana, son 8 al mes. Si son 3, son 12.
                    El porcentaje indica cuántos PDVs están en cada ritmo.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Kpi
                    icon={<MapPin className="w-5 h-5 text-blue-600" />}
                    color="bg-blue-100"
                    value={totalPdvs.toLocaleString('es-PE')}
                    label="PDVs activos"
                    hint="Puntos de venta que venden en el filtro"
                />
                <Kpi
                    icon={<Repeat className="w-5 h-5 text-sky-600" />}
                    color="bg-sky-100"
                    value={`${pct(once, totalPdvs)}%`}
                    label="1 visita por semana"
                    hint={`${once.toLocaleString('es-PE')} PDVs · 4 visitas al mes`}
                />
                <Kpi
                    icon={<CalendarDays className="w-5 h-5 text-indigo-600" />}
                    color="bg-indigo-100"
                    value={`${pct(twice, totalPdvs)}%`}
                    label="2 visitas por semana"
                    hint={`${twice.toLocaleString('es-PE')} PDVs · 8 visitas al mes`}
                />
                <Kpi
                    icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
                    color="bg-violet-100"
                    value={`${pct(threePlus, totalPdvs)}%`}
                    label="3 o más visitas por semana"
                    hint={`${threePlus.toLocaleString('es-PE')} PDVs · 12 o más al mes`}
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                    <strong className="text-gray-900">{qMonth.toLocaleString('es-PE')}</strong> visitas programadas en el mes (Q Integratel)
                </span>
                {none > 0 && (
                    <span className="text-gray-500">
                        {pct(none, totalPdvs)}% ({none.toLocaleString('es-PE')}) sin fecha de visita este mes
                    </span>
                )}
            </div>
        </div>
    );
}

function Kpi({
    icon,
    color,
    label,
    value,
    hint,
}: {
    icon: ReactNode;
    color: string;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900 leading-tight">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{hint}</p>
                </div>
            </div>
        </div>
    );
}
