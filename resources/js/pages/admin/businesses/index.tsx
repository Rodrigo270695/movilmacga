import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BusinessForm } from '@/components/admin/businesses/business-form';
import { BusinessesTable } from '@/components/admin/businesses/businesses-table';
import { AssociateZonalesModal } from '@/components/admin/businesses/associate-zonales-modal';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';

interface Zonal {
    id: number;
    name: string;
    status?: boolean | number;
    business_id?: number | null;
}

interface Business {
    id: number;
    name: string;
    status?: boolean | number;
    zonales_count?: number;
    active_zonales_count?: number;
    created_at: string;
    zonales?: Zonal[];
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
    availableZonales: Zonal[];
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
        title: 'Gestión de Negocios',
        href: '/admin/businesses',
    },
];

export default function BusinessesIndex({ businesses, availableZonales, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isBusinessFormOpen, setIsBusinessFormOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [isAssociateZonalesOpen, setIsAssociateZonalesOpen] = useState(false);
    const [associatingBusiness, setAssociatingBusiness] = useState<Business | null>(null);

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

    const openCreateBusinessDialog = () => {
        if (!hasPermission('gestor-business-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear negocios.',
                duration: 4000
            });
            return;
        }
        setEditingBusiness(null);
        setIsBusinessFormOpen(true);
    };

    const openEditBusinessDialog = (business: Business) => {
        if (!hasPermission('gestor-business-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar negocios.',
                duration: 4000
            });
            return;
        }
        setEditingBusiness(business);
        setIsBusinessFormOpen(true);
    };

    const openAssociateZonalesDialog = (business: Business) => {
        if (!hasPermission('gestor-business-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para gestionar zonales de negocios.',
                duration: 4000
            });
            return;
        }
        setAssociatingBusiness(business);
        setIsAssociateZonalesOpen(true);
    };



    const closeBusinessForm = () => {
        setIsBusinessFormOpen(false);
        setEditingBusiness(null);
    };

    const closeAssociateZonales = () => {
        setIsAssociateZonalesOpen(false);
        setAssociatingBusiness(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Negocios" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Gestión de Negocios
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Administra los negocios y sus zonales asignados
                                    </p>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{businesses.total} negocios</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{availableZonales.length} zonales disponibles</span>
                                        </div>
                                        {businesses.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {businesses.current_page}/{businesses.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botones desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-business-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateBusinessDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Negocio
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de negocios - Responsive */}
                    <BusinessesTable
                        businesses={businesses}
                        onEdit={openEditBusinessDialog}
                        onAssociateZonales={openAssociateZonalesDialog}
                        userPermissions={userPermissions}
                    />

                    {/* Modales */}
                    <BusinessForm
                        isOpen={isBusinessFormOpen}
                        onClose={closeBusinessForm}
                        business={editingBusiness}
                        availableZonales={availableZonales}
                    />

                    <AssociateZonalesModal
                        isOpen={isAssociateZonalesOpen}
                        onClose={closeAssociateZonales}
                        business={associatingBusiness}
                        availableZonales={availableZonales}
                    />
                </div>

                {/* Botones flotantes - Solo móviles */}
                {hasPermission('gestor-business-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateBusinessDialog}
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
