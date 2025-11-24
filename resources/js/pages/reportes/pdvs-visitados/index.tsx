import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PdvVisitadosFilters } from '@/components/reportes/pdvs-visitados/pdv-visitados-filters';
import { PdvVisitadosTable } from '@/components/reportes/pdvs-visitados/pdv-visitados-table';

import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    classification: string;
    status: string;
}

interface PdvVisit {
    id: number;
    check_in_at: string;
    check_out_at?: string;
    visit_status: 'in_progress' | 'completed' | 'cancelled';
    duration_minutes?: number;
    distance_to_pdv?: number;
    latitude: number;
    longitude: number;
    used_mock_location?: boolean | null;
    user: User;
    pdv: Pdv;
}

interface PaginatedVisitas {
    data: PdvVisit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}



interface Filtros {
    fecha_desde: string;
    fecha_hasta: string;
    vendedor_id?: string;
    pdv_id?: string;
    estado?: string;
    mock_location?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    route_id?: string;
}

interface Opciones {
    businesses: Array<{ id: number; name: string }>;
    allZonales: Array<{ id: number; name: string; business_id?: number }>;
    allCircuits: Array<{ id: number; name: string; code: string; zonal_id?: number }>;
    zonales: Array<{ id: number; name: string }>;
    circuits: Array<{ id: number; name: string; code: string }>;
    routes: Array<{ id: number; name: string }>;
    vendedores: User[];
    pdvs: Pdv[];
    estados: Array<{ value: string; label: string }>;
}

interface PageProps {
    auth?: {
        user?: {
            permissions?: string[];
        };
    };
}

interface Props {
    visitas: PaginatedVisitas;
    filtros: Filtros;
    opciones: Opciones;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reportes',
        href: '#',
    },
    {
        title: 'PDVs Visitados',
        href: '/reportes/pdvs-visitados',
    },
];

export default function PdvVisitadosIndex({ visitas, filtros, opciones, flash }: Props) {
    const { addToast } = useToast();
    const pageProps = usePage().props as PageProps;
    const userPermissions = pageProps.auth?.user?.permissions || [];

    const [isExporting, setIsExporting] = useState(false);
    const [incluirFormularios, setIncluirFormularios] = useState(true);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Mostrar toasts para mensajes flash
    useEffect(() => {
        if (flash?.success) {
            addToast({
                type: 'success',
                title: '¡Éxito!',
                message: flash.success,
                duration: 4000
            });
        }

        if (flash?.error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: flash.error,
                duration: 5000
            });
        }
    }, [flash, addToast]);

    const handleExport = async (formato: 'excel' | 'pdf') => {
        if (!hasPermission('reporte-pdvs-visitados-exportar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para exportar reportes.',
                duration: 4000
            });
            return;
        }

        setIsExporting(true);

        try {
            // Construir URL con filtros actuales
            const params = new URLSearchParams();
            if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
            if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
            if (filtros.vendedor_id && filtros.vendedor_id !== 'todos') params.set('vendedor_id', filtros.vendedor_id);
            if (filtros.pdv_id && filtros.pdv_id !== 'todos') params.set('pdv_id', filtros.pdv_id);
            if (filtros.estado && filtros.estado !== 'todos') params.set('estado', filtros.estado);
            if (filtros.mock_location && filtros.mock_location !== 'todos') params.set('mock_location', filtros.mock_location);
            if (filtros.business_id && filtros.business_id !== 'todos') params.set('business_id', filtros.business_id);
            if (filtros.zonal_id && filtros.zonal_id !== 'todos') params.set('zonal_id', filtros.zonal_id);
            if (filtros.circuit_id && filtros.circuit_id !== 'todos') params.set('circuit_id', filtros.circuit_id);
            if (filtros.route_id && filtros.route_id !== 'todos') params.set('route_id', filtros.route_id);
            params.set('formato', formato);
            params.set('incluir_formularios', incluirFormularios.toString());

            const url = `/reportes/pdvs-visitados/exportar?${params.toString()}`;

            // Crear enlace temporal para descarga
            const link = document.createElement('a');
            link.href = url;
            const fileName = incluirFormularios
                ? `pdvs_visitados_con_formularios_${filtros.fecha_desde}_a_${filtros.fecha_hasta}.xlsx`
                : `pdvs_visitados_${filtros.fecha_desde}_a_${filtros.fecha_hasta}.xlsx`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addToast({
                type: 'success',
                title: '¡Exportación iniciada!',
                message: incluirFormularios
                    ? 'El reporte con respuestas de formularios se está descargando.'
                    : 'El reporte básico se está descargando en formato Excel.',
                duration: 4000
            });
        } catch {
            addToast({
                type: 'error',
                title: 'Error en exportación',
                message: 'No se pudo exportar el reporte. Inténtalo de nuevo.',
                duration: 4000
            });
        } finally {
            setIsExporting(false);
        }
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte de PDVs Visitados" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Reporte de PDVs Visitados
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Análisis detallado de visitas a puntos de venta
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{visitas.total} visitas</span>
                                        </div>
                                        {visitas.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>Pág. {visitas.current_page}/{visitas.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botón exportar desktop - Solo mostrar en pantallas grandes */}
                                <div className="hidden sm:flex items-center gap-3">
                                    {hasPermission('reporte-pdvs-visitados-exportar') && (
                                        <div className="flex items-center gap-3">
                                            {/* Checkbox para incluir formularios */}
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={incluirFormularios}
                                                    onChange={(e) => setIncluirFormularios(e.target.checked)}
                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                />
                                                <span>Incluir respuestas de formularios</span>
                                            </label>

                                            <Button
                                                onClick={() => handleExport('excel')}
                                                disabled={isExporting}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                {isExporting ? 'Exportando...' : 'Exportar Excel (.xlsx)'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros Inline */}
                    <PdvVisitadosFilters
                        filtros={filtros}
                        opciones={opciones}
                    />

                    {/* Tabla de visitas - Responsive */}
                    <PdvVisitadosTable
                        visitas={visitas}
                    />

                    {/* Paginación */}
                    {visitas.last_page > 1 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <Pagination
                                data={{
                                    current_page: visitas.current_page,
                                    last_page: visitas.last_page,
                                    total: visitas.total,
                                    per_page: visitas.per_page,
                                    from: visitas.from,
                                    to: visitas.to,
                                }}
                                onPageChange={(page) => {
                                    const params = new URLSearchParams();
                                    Object.entries(filtros).forEach(([key, value]) => {
                                        if (value && value !== 'todos') {
                                            params.set(key, value);
                                        }
                                    });
                                    params.set('page', page.toString());
                                    router.visit(`/reportes/pdvs-visitados?${params.toString()}`, {
                                        preserveState: true,
                                        preserveScroll: true
                                    });
                                }}
                                onPerPageChange={(perPage) => {
                                    const params = new URLSearchParams();
                                    Object.entries(filtros).forEach(([key, value]) => {
                                        if (value && value !== 'todos') {
                                            params.set(key, value);
                                        }
                                    });
                                    params.set('per_page', perPage.toString());
                                    params.set('page', '1');
                                    router.visit(`/reportes/pdvs-visitados?${params.toString()}`, {
                                        preserveState: true,
                                        preserveScroll: true
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Botón exportar flotante - Solo móviles */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                    {hasPermission('reporte-pdvs-visitados-exportar') && (
                        <div className="flex flex-col items-end gap-2">
                            {/* Checkbox para incluir formularios */}
                            <label className="flex items-center gap-2 text-xs text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={incluirFormularios}
                                    onChange={(e) => setIncluirFormularios(e.target.checked)}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span>Con formularios</span>
                            </label>

                            <Button
                                onClick={() => handleExport('excel')}
                                size="lg"
                                disabled={isExporting}
                                className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                title={isExporting ? 'Exportando...' : 'Exportar Excel (.xlsx)'}
                            >
                                <Download className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
