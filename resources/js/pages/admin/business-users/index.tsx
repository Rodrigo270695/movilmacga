import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BusinessUsersTable } from '@/components/admin/business-users/business-users-table';
import { UserAssignmentModal } from '@/components/admin/business-users/user-assignment-modal';
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
    active_users?: User[];
}

interface PaginatedBusinesses {
    data: Business[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    businesses: PaginatedBusinesses;
    users: User[];
    allBusinesses: Business[];
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
        title: 'Admin',
        href: '#',
    },
    {
        title: 'Usuario-Negocio',
        href: '/admin/business-users',
    },
];

export default function BusinessUsersIndex({ businesses, users, allBusinesses, businessScope, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [modalMode, setModalMode] = useState<'assign' | 'reassign'>('assign');

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Calcular estadísticas
    const totalAssigned = businesses.data.filter(business => business.active_users && business.active_users.length > 0).length;
    const totalUnassigned = businesses.data.filter(business => !business.active_users || business.active_users.length === 0).length;
    const activeUsers = users.filter(user => user.status).length;

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

    const openAssignDialog = (business: Business) => {
        if (!hasPermission('gestor-business-user-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para asignar usuarios.',
                duration: 4000
            });
            return;
        }
        setSelectedBusiness(business);
        setModalMode('assign');
        setIsAssignmentModalOpen(true);
    };

    const openReassignDialog = (business: Business) => {
        if (!hasPermission('gestor-business-user-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para reasignar usuarios.',
                duration: 4000
            });
            return;
        }
        setSelectedBusiness(business);
        setModalMode('reassign');
        setIsAssignmentModalOpen(true);
    };

    const closeAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
        setSelectedBusiness(null);
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
            <Head title="Gestión Usuario-Negocio" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Profesional y limpio */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                    Gestión Usuario-Negocio
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Administra las asignaciones de usuarios a negocios del sistema
                                    {businessScope.has_business_restriction && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {businessScope.business_id ? 'Negocio específico' : `${businessScope.business_ids.length} negocios`}
                                        </span>
                                    )}
                                </p>
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs text-green-700">
                                        ✨ <strong>Nuevo:</strong> Los usuarios ahora pueden estar asignados a múltiples negocios simultáneamente
                                    </p>
                                </div>

                                {/* Estadísticas mejoradas */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>{businesses.total} negocios</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{totalAssigned} con usuarios</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>{totalUnassigned} sin usuarios</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>{activeUsers} usuarios activos</span>
                                    </div>
                                    {businesses.last_page > 1 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                            <span>Página {businesses.current_page} de {businesses.last_page}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla principal */}
                    <BusinessUsersTable
                        businesses={businesses}
                        allBusinesses={allBusinesses}
                        filters={filters}
                        onAssign={openAssignDialog}
                        onReassign={openReassignDialog}
                        onError={handleAssignmentError}
                        userPermissions={userPermissions}
                    />

                    {/* Modal de asignación */}
                    {isAssignmentModalOpen && selectedBusiness && (
                        <UserAssignmentModal
                            business={selectedBusiness}
                            users={users}
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
