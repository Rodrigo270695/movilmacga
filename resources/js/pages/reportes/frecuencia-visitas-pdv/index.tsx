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
            if (value && value !== 'todos') params.set(key, value);
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
        window.print();
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

            <style>{`
                @media print {
                    aside, [data-sidebar], header, .no-print, nav {
                        display: none !important;
                    }
                    main, [data-slot="sidebar-inset"] {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    body { background: white !important; }
                    .print-only { display: block !important; }
                    .print-break { break-inside: avoid; page-break-inside: avoid; }
                }
                .print-only { display: none; }
            `}</style>

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6 print:space-y-4">
                    <div className="print-only mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Frecuencia de visitas PDV — Integratel</h1>
                        <p className="text-sm text-gray-600">
                            Período: {periodo.label} ({periodo.start} al {periodo.end})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Fórmula: visitas por semana × 4 = Q de visitas al mes. Ejemplo: 3/semana = 12/mes.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm no-print">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-break">
                        <Kpi icon={<MapPin className="w-5 h-5 text-blue-600" />} color="bg-blue-100" label="PDVs activos" value={kpis.total_pdvs} />
                        <Kpi icon={<Repeat className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100" label="Promedio / semana" value={kpis.avg_week} />
                        <Kpi icon={<CalendarDays className="w-5 h-5 text-sky-600" />} color="bg-sky-100" label="Promedio Q / mes" value={kpis.avg_month} />
                        <Kpi icon={<BarChart3 className="w-5 h-5 text-violet-600" />} color="bg-violet-100" label="Q total del mes" value={kpis.q_month_total} />
                    </div>

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

function Kpi({ icon, color, label, value }: { icon: ReactNode; color: string; label: string; value: number }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm print-break">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString('es-PE') : value}
                    </p>
                </div>
            </div>
        </div>
    );
}
