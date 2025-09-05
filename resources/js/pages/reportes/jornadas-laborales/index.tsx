import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download, Clock, MapPin, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkingSessionsFilters } from '@/components/reportes/jornadas-laborales/working-sessions-filters';
import { WorkingSessionsTable } from '@/components/reportes/jornadas-laborales/working-sessions-table';
import { PdvRouteModal } from '@/components/reportes/jornadas-laborales/pdv-route-modal';

import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal?: {
        id: number;
        name: string;
    };
}

interface WorkingSession {
    id: number;
    started_at: string;
    ended_at?: string;
    status: string;
    status_label: string;
    total_distance_km?: number;
    total_pdvs_visited: number;
    total_duration_minutes?: number;
    duration_formatted: string;
    formatted_start_time: string;
    formatted_start_date: string;
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
    notes?: string;
    user: User;
    active_circuit?: Circuit;
    assigned_route?: {
        id: number;
        name: string;
        code: string;
    };
    route_pdvs_count: number;
    visited_pdvs_count: number;
}

interface PaginatedSessions {
    data: WorkingSession[];
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

interface Stats {
    total_sessions: number;
    completed_sessions: number;
    active_sessions: number;
    avg_duration_minutes: number;
    avg_duration_formatted: string;
    total_pdvs_visited: number;
    total_distance_km: number;
}

interface Filtros {
    date_from?: string;
    date_to?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    user_id?: string;
    status?: string;
    per_page?: string;
}

interface Opciones {
    businesses: Array<{ id: number; name: string }>;
    allZonales: Array<{ id: number; name: string; business_id: number }>;
    allCircuits: Array<{ id: number; name: string; code: string; zonal_id: number }>;
    zonales: Array<{ id: number; name: string; business_id: number }>;
    circuits: Array<{ id: number; name: string; code: string; zonal_id: number }>;
    users: User[];
    statuses: Array<{ value: string; label: string }>;
}

interface PageProps {
    auth?: {
        user?: {
            permissions?: string[];
        };
    };
}

interface Props {
    sessions: PaginatedSessions;
    filtros: Filtros;
    opciones: Opciones;
    stats: Stats;
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
        title: 'Jornadas Laborales',
        href: '/reportes/jornadas-laborales',
    },
];

export default function WorkingSessionsIndex({ sessions, filtros, opciones, stats, flash }: Props) {
    const { addToast } = useToast();
    const pageProps = usePage().props as PageProps;
    const userPermissions = pageProps.auth?.user?.permissions || [];

    const [isExporting, setIsExporting] = useState(false);
    const [isPdvModalOpen, setIsPdvModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [selectedVisitDate, setSelectedVisitDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(0);
    const [selectedWorkingSession, setSelectedWorkingSession] = useState<any>(null);

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
        if (!hasPermission('reporte-jornadas-laborales-exportar')) {
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
            if (filtros.date_from) params.set('date_from', filtros.date_from);
            if (filtros.date_to) params.set('date_to', filtros.date_to);
            if (filtros.business_id && filtros.business_id !== 'todos') params.set('business_id', filtros.business_id);
            if (filtros.zonal_id && filtros.zonal_id !== 'todos') params.set('zonal_id', filtros.zonal_id);
            if (filtros.circuit_id && filtros.circuit_id !== 'todos') params.set('circuit_id', filtros.circuit_id);
            if (filtros.user_id && filtros.user_id !== 'todos') params.set('user_id', filtros.user_id);
            if (filtros.status && filtros.status !== 'todos') params.set('status', filtros.status);
            params.set('formato', formato);

            const url = `/reportes/jornadas-laborales/exportar?${params.toString()}`;

            // Crear enlace temporal para descarga
            const link = document.createElement('a');
            link.href = url;
            const fileName = `jornadas_laborales_${filtros.date_from || 'todas'}_a_${filtros.date_to || 'todas'}.xlsx`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addToast({
                type: 'success',
                title: '¡Exportación iniciada!',
                message: 'El reporte de jornadas laborales se está descargando en formato Excel.',
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

    const handleViewPdvRoute = (route: any, visitDate: string, userId: number, workingSession?: any) => {
        setSelectedRoute(route);
        setSelectedVisitDate(visitDate);
        setSelectedUserId(userId);
        setSelectedWorkingSession(workingSession);
        setIsPdvModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte de Jornadas Laborales" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Reporte de Jornadas Laborales
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Análisis detallado de jornadas laborales y puntos de inicio
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{sessions.total} jornadas</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{stats.completed_sessions} completadas</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            <span>{stats.active_sessions} activas</span>
                                        </div>
                                        {sessions.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {sessions.current_page}/{sessions.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botón exportar desktop - Solo mostrar en pantallas grandes */}
                                <div className="hidden sm:flex items-center gap-3">
                                    {hasPermission('reporte-jornadas-laborales-exportar') && (
                                        <Button
                                            onClick={() => handleExport('excel')}
                                            disabled={isExporting}
                                            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            {isExporting ? 'Exportando...' : 'Exportar Excel (.xlsx)'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Duración Promedio</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.avg_duration_formatted}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">PDVs Visitados</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.total_pdvs_visited}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Distancia Total</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.total_distance_km.toFixed(1)} km</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Jornadas Activas</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.active_sessions}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <WorkingSessionsFilters
                        filtros={filtros}
                        opciones={opciones}
                    />

                    {/* Tabla de jornadas */}
                    <WorkingSessionsTable
                        sessions={sessions}
                        userPermissions={userPermissions}
                        onViewPdvRoute={handleViewPdvRoute}
                    />

                    {/* Paginación */}
                    {sessions.last_page > 1 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <Pagination
                                data={{
                                    current_page: sessions.current_page,
                                    last_page: sessions.last_page,
                                    total: sessions.total,
                                    per_page: sessions.per_page,
                                    from: sessions.from,
                                    to: sessions.to,
                                }}
                                onPageChange={(page) => {
                                    const params = new URLSearchParams();
                                    Object.entries(filtros).forEach(([key, value]) => {
                                        if (value && value !== 'todos') {
                                            params.set(key, value);
                                        }
                                    });

                                    // Preservar el per_page actual
                                    params.set('per_page', sessions.per_page.toString());
                                    params.set('page', page.toString());

                                    router.visit(`/reportes/jornadas-laborales?${params.toString()}`, {
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
                                    router.visit(`/reportes/jornadas-laborales?${params.toString()}`, {
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
                    {hasPermission('reporte-jornadas-laborales-exportar') && (
                        <Button
                            onClick={() => handleExport('excel')}
                            size="lg"
                            disabled={isExporting}
                            className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                            title={isExporting ? 'Exportando...' : 'Exportar Excel (.xlsx)'}
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Modal de PDVs de la Ruta */}
            <PdvRouteModal
                isOpen={isPdvModalOpen}
                onClose={() => {
                    setIsPdvModalOpen(false);
                    setSelectedRoute(null);
                    setSelectedVisitDate('');
                    setSelectedUserId(0);
                    setSelectedWorkingSession(null);
                }}
                route={selectedRoute}
                visitDate={selectedVisitDate}
                userId={selectedUserId}
                workingSession={selectedWorkingSession}
            />

        </AppLayout>
    );
}
