import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ZonalSupervisorsTable } from '@/components/dcs/zonal-supervisors/zonal-supervisors-table';
import { SupervisorAssignmentModal } from '@/components/dcs/zonal-supervisors/supervisor-assignment-modal';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: boolean;
}

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface Zonal {
    id: number;
    name: string;
    status: boolean;
    business: Business;
    active_zonal_supervisor?: {
        id: number;
        user_id: number;
        assigned_at: string;
        notes?: string;
        supervisor: User;
    };
}

interface PaginatedZonals {
    data: Zonal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    zonals: PaginatedZonals;
    supervisors: User[];
    businesses: Business[];
    filters: {
        search?: string;
        business?: string;
        status?: string;
        per_page?: number;
    };
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
        title: 'DCS',
        href: '#',
    },
    {
        title: 'Supervisor-Zonal',
        href: '/dcs/zonal-supervisors',
    },
];

export default function ZonalSupervisorsIndex({ zonals, supervisors, businesses, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedZonal, setSelectedZonal] = useState<Zonal | null>(null);
    const [modalMode, setModalMode] = useState<'assign' | 'reassign'>('assign');

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Calcular estadísticas
    const totalAssigned = zonals.data.filter(zonal => zonal.active_zonal_supervisor).length;
    const totalUnassigned = zonals.data.filter(zonal => !zonal.active_zonal_supervisor).length;

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

    const openAssignmentDialog = () => {
        if (!hasPermission('gestor-zonal-supervisor-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para gestionar asignaciones de supervisores.',
                duration: 4000
            });
            return;
        }

        addToast({
            type: 'info',
            title: 'Asignación de supervisores',
            message: 'Selecciona un zonal de la tabla para asignar o reasignar un supervisor.',
            duration: 3000
        });
    };

    const openAssignDialog = (zonal: Zonal) => {
        if (!hasPermission('gestor-zonal-supervisor-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para asignar supervisores.',
                duration: 4000
            });
            return;
        }
        setSelectedZonal(zonal);
        setModalMode('assign');
        setIsAssignmentModalOpen(true);
    };

    const openReassignDialog = (zonal: Zonal) => {
        if (!hasPermission('gestor-zonal-supervisor-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para reasignar supervisores.',
                duration: 4000
            });
            return;
        }
        setSelectedZonal(zonal);
        setModalMode('reassign');
        setIsAssignmentModalOpen(true);
    };

    const closeAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
        setSelectedZonal(null);
    };

    const handleAssignmentSuccess = (message: string) => {
        addToast({
            type: 'success',
            title: 'Éxito',
            message: message,
            duration: 4000
        });
        closeAssignmentModal();
    };

    const handleAssignmentError = (message: string) => {
        addToast({
            type: 'error',
            title: 'Error',
            message: message,
            duration: 5000
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión Supervisor-Zonal" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Gestión Supervisor-Zonal
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Asigna supervisores a zonales para gestionar vendedores y circuitos
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{zonals.total} zonales</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{totalAssigned} con supervisor</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <span>{totalUnassigned} sin supervisor</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span>{supervisors.length} supervisores disponibles</span>
                                        </div>
                                        {zonals.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>Pág. {zonals.current_page}/{zonals.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-zonal-supervisor-asignar') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openAssignmentDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Gestionar Asignaciones
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de asignaciones - Responsive */}
                    <ZonalSupervisorsTable
                        zonals={zonals}
                        businesses={businesses}
                        filters={filters}
                        onAssignSupervisor={openAssignDialog}
                        onReassignSupervisor={openReassignDialog}
                        onAssignmentError={handleAssignmentError}
                    />

                    {/* Modal de asignación */}
                    {isAssignmentModalOpen && selectedZonal && (
                        <SupervisorAssignmentModal
                            zonal={selectedZonal}
                            supervisors={supervisors}
                            mode={modalMode}
                            onClose={closeAssignmentModal}
                            onSuccess={handleAssignmentSuccess}
                            onError={handleAssignmentError}
                        />
                    )}
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-zonal-supervisor-asignar') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openAssignmentDialog}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <UserPlus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
