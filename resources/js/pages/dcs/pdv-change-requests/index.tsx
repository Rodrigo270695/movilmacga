import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { PdvChangeRequestsTable } from '@/components/dcs/pdv-change-requests/pdv-change-requests-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';

interface Route {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
    circuit?: Circuit;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    address: string;
    reference: string;
    latitude: number | null;
    longitude: number | null;
    route_id?: number;
    route?: Route;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id?: number;
    business?: Business;
}

interface ChangeRequest {
    id: number;
    pdv_id: number;
    user_id: number;
    zonal_id: number;
    status: 'pending' | 'approved' | 'rejected';
    original_data: {
        address?: string;
        reference?: string;
        latitude?: number;
        longitude?: number;
    };
    changes: {
        address?: string;
        reference?: string;
        latitude?: number;
        longitude?: number;
    };
    reason: string | null;
    rejection_reason: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    created_at: string;
    updated_at: string;
    pdv: Pdv;
    user: User;
    zonal: Zonal;
}

interface PaginatedChangeRequests {
    data: ChangeRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface Props {
    changeRequests: PaginatedChangeRequests;
    availableZonals: Zonal[];
    stats: Stats;
    businessScope: {
        is_admin: boolean;
        business_ids: number[];
        zonal_ids: number[];
        has_business_restriction: boolean;
        has_zonal_restriction: boolean;
    };
    filters?: {
        search?: string;
        status?: string;
        zonal?: string;
        per_page?: number;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
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
        title: 'Aprobaciones PDV',
        href: '/dcs/pdv-change-requests',
    },
];

export default function PdvChangeRequestsIndex({
    changeRequests,
    availableZonals,
    stats,
    filters,
    flash
}: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = auth?.user?.permissions || [];

    // Mostrar toasts para mensajes flash
    useEffect(() => {
        if (flash?.success) {
            addToast({
                type: 'success',
                title: '¡Éxito!',
                message: flash.success,
                duration: 5000
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

        if (flash?.warning) {
            addToast({
                type: 'warning',
                title: 'Advertencia',
                message: flash.warning,
                duration: 5000
            });
        }
    }, [flash, addToast]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aprobaciones PDV" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Aprobaciones de Cambios PDV
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Revisa y aprueba las solicitudes de cambio de dirección, referencia y coordenadas de PDVs
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{stats.total} solicitudes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                            <span>{stats.pending} pendientes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{stats.approved} aprobadas</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <span>{stats.rejected} rechazadas</span>
                                        </div>
                                        {changeRequests.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {changeRequests.current_page}/{changeRequests.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de solicitudes - Responsive */}
                    <PdvChangeRequestsTable
                        changeRequests={changeRequests}
                        availableZonals={availableZonals}
                        userPermissions={userPermissions}
                        filters={filters}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
