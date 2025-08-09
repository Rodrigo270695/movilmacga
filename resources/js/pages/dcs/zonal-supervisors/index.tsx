import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
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

interface ZonalSupervisorAssignment {
    id: number;
    user_id: number;
    assigned_at: string;
    notes?: string;
    supervisor: User;
}

interface Zonal {
    id: number;
    name: string;
    status: boolean;
    business: Business;
    active_zonal_supervisor?: ZonalSupervisorAssignment;
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
    businessScope: {
        is_admin: boolean;
        business_id?: number;
        business_ids: number[];
        zonal_ids: number[];
        has_business_restriction: boolean;
        has_zonal_restriction: boolean;
    };
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

export default function ZonalSupervisorsIndex({ zonals, supervisors, businesses, businessScope, filters, flash }: Props) {
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
    const activeSupervisors = supervisors.filter(supervisor => supervisor.status).length;

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

                    {/* Header - Profesional y limpio */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                    Gestión Supervisor-Zonal
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Administra las asignaciones de supervisores a zonales del sistema
                                    {businessScope.has_business_restriction && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {businessScope.business_id ? 'Negocio específico' : `${businessScope.business_ids.length} negocios`}
                                        </span>
                                    )}
                                    {businessScope.has_zonal_restriction && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Supervisor: {businessScope.zonal_ids.length} zonales
                                        </span>
                                    )}
                                </p>

                                {/* Estadísticas mejoradas */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>{zonals.total} zonales</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{totalAssigned} asignados</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>{totalUnassigned} sin asignar</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>{activeSupervisors} supervisores activos</span>
                                    </div>
                                    {zonals.last_page > 1 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                            <span>Página {zonals.current_page} de {zonals.last_page}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla principal */}
                    <ZonalSupervisorsTable
                        zonals={zonals}
                        businesses={businesses}
                        filters={filters}
                        onAssign={openAssignDialog}
                        onReassign={openReassignDialog}
                        onError={handleAssignmentError}
                        userPermissions={userPermissions}
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


            </div>
        </AppLayout>
    );
}
