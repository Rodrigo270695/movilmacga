import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ZonalForm } from '@/components/dcs/zonales/zonal-form';
import { ZonalesTable } from '@/components/dcs/zonales/zonales-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface Zonal {
    id: number;
    name: string;
    status?: boolean | number;
    created_at: string;
    business?: Business;
    business_id?: number;
}

interface PaginatedZonales {
    data: Zonal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    zonales: PaginatedZonales;
    filters?: {
        search?: string;
        business_filter?: string;
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
        title: 'Gestión de Zonales',
        href: '/dcs/zonales',
    },
];

export default function ZonalesIndex({ zonales, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isZonalFormOpen, setIsZonalFormOpen] = useState(false);
    const [editingZonal, setEditingZonal] = useState<Zonal | null>(null);

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

    const openCreateZonalDialog = () => {
        if (!hasPermission('gestor-zonal-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear zonales.',
                duration: 4000
            });
            return;
        }
        setEditingZonal(null);
        setIsZonalFormOpen(true);
    };

    const openEditZonalDialog = (zonal: Zonal) => {
        if (!hasPermission('gestor-zonal-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar zonales.',
                duration: 4000
            });
            return;
        }
        setEditingZonal(zonal);
        setIsZonalFormOpen(true);
    };

    const closeZonalForm = () => {
        setIsZonalFormOpen(false);
        setEditingZonal(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Zonales" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Gestión de Zonales
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Administra los zonales del sistema
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{zonales.total} zonales</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{zonales.data.filter(z => z.status).length} activos</span>
                                        </div>
                                        {zonales.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {zonales.current_page}/{zonales.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-zonal-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateZonalDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Zonal
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de zonales - Responsive */}
                    <ZonalesTable
                        zonales={zonales}
                        onEdit={openEditZonalDialog}
                        userPermissions={userPermissions}
                        filters={filters}
                    />

                    {/* Modales */}
                    <ZonalForm
                        isOpen={isZonalFormOpen}
                        onClose={closeZonalForm}
                        zonal={editingZonal}
                    />
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-zonal-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateZonalDialog}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
