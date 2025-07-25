import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { RoutesTable } from '@/components/dcs/routes/routes-table';
import { RouteForm } from '@/components/dcs/routes/route-form';
import { ConfirmToggleModal } from '@/components/dcs/routes/confirm-toggle-modal';
import { type BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    Route,
    Plus
} from 'lucide-react';

interface Route {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    circuit_id: number;
    created_at: string;
    circuit?: {
        id: number;
        name: string;
        zonal?: {
            id: number;
            name: string;
        };
    };
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Props {
    routes: {
        data: Route[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    circuit: Circuit;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function RoutesIndex({ routes, circuit, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    // Estados para modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [toggleModalData, setToggleModalData] = useState<{ route: Route } | null>(null);

    // Breadcrumbs dinámicos
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
            title: 'Zonales',
            href: '/dcs/zonales',
        },
        {
            title: circuit.zonal?.name || 'Zonal',
            href: '/dcs/zonales',
        },
        {
            title: 'Circuitos',
            href: `/dcs/zonales/${circuit.zonal?.id}/circuits`,
        },
        {
            title: `${circuit.name} - Rutas`,
            href: `/dcs/zonales/${circuit.zonal?.id}/circuits/${circuit.id}/routes`,
        },
    ];

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

    const openCreateModal = () => {
        if (!hasPermission('gestor-ruta-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear rutas.',
                duration: 4000
            });
            return;
        }
        setEditingRoute(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (route: Route) => {
        if (!hasPermission('gestor-ruta-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar rutas.',
                duration: 4000
            });
            return;
        }
        setEditingRoute(route);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingRoute(null);
    };

    const openToggleModal = (route: Route) => {
        setToggleModalData({ route });
    };

    const closeToggleModal = () => {
        setToggleModalData(null);
    };

    const goBackToCircuits = () => {
        router.visit(route('dcs.zonales.circuits.index', circuit.zonal?.id));
    };

        return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Rutas - ${circuit.name}`} />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">

                                {/* Botón Volver + Título */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goBackToCircuits}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 cursor-pointer"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Volver a Circuitos</span>
                                        <span className="sm:hidden">Volver</span>
                                    </Button>

                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                            Rutas - {circuit.name}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                            Administra las rutas del circuito seleccionado
                                        </p>

                                        {/* Stats - Responsive */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>{routes.total} rutas</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>{routes.data.filter(r => r.status === true || r.status === 1).length} activas</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span>Circuito: {circuit.code}</span>
                                            </div>
                                            {routes.last_page > 1 && (
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                    <span>Pág. {routes.current_page}/{routes.last_page}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-ruta-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nueva Ruta
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Rutas - Responsive */}
                    <RoutesTable
                        routes={routes}
                        circuit={circuit}
                        onEdit={openEditModal}
                        onToggleStatus={openToggleModal}
                    />

                    {/* Modales */}
                    <RouteForm
                        isOpen={isFormModalOpen}
                        onClose={closeFormModal}
                        route={editingRoute}
                        circuit={circuit}
                    />

                    {/* Modal de Confirmación de Estado */}
                    {toggleModalData && (
                        <ConfirmToggleModal
                            isOpen={true}
                            onClose={closeToggleModal}
                            route={toggleModalData.route}
                            circuit={circuit}
                        />
                    )}
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-ruta-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
