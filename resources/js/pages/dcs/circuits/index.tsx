import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, usePage } from '@inertiajs/react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CircuitForm } from '@/components/dcs/circuits/circuit-form';
import { CircuitsTable } from '@/components/dcs/circuits/circuits-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal_id: number;
    created_at: string;
    routes_count?: number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Zonal {
    id: number;
    name: string;
}

interface PaginatedCircuits {
    data: Circuit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    circuits: PaginatedCircuits;
    zonal: Zonal;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CircuitsIndex({ circuits, zonal, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isCircuitFormOpen, setIsCircuitFormOpen] = useState(false);
    const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);

    // Breadcrumbs dinámicos con el zonal actual
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
            title: zonal.name,
            href: `/dcs/zonales/${zonal.id}/circuits`,
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

    const openCreateCircuitDialog = () => {
        if (!hasPermission('gestor-circuito-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear circuitos.',
                duration: 4000
            });
            return;
        }
        setEditingCircuit(null);
        setIsCircuitFormOpen(true);
    };

    const openEditCircuitDialog = (circuit: Circuit) => {
        if (!hasPermission('gestor-circuito-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar circuitos.',
                duration: 4000
            });
            return;
        }
        setEditingCircuit(circuit);
        setIsCircuitFormOpen(true);
    };

    const closeCircuitForm = () => {
        setIsCircuitFormOpen(false);
        setEditingCircuit(null);
    };

    const goBackToZonales = () => {
        router.visit('/dcs/zonales');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Circuitos - ${zonal.name}`} />

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
                                        onClick={goBackToZonales}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 cursor-pointer"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Volver a Zonales</span>
                                        <span className="sm:hidden">Volver</span>
                                    </Button>

                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                            Circuitos - {zonal.name}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                            Administra los circuitos del zonal seleccionado
                                        </p>

                                        {/* Stats - Responsive */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>{circuits.total} circuitos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>{circuits.data.filter(c => c.status).length} activos</span>
                                            </div>
                                            {circuits.last_page > 1 && (
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                    <span>Pág. {circuits.current_page}/{circuits.last_page}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-circuito-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateCircuitDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Circuito
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de circuitos - Responsive */}
                    <CircuitsTable
                        circuits={circuits}
                        zonal={zonal}
                        onEdit={openEditCircuitDialog}
                        userPermissions={userPermissions}
                    />

                    {/* Modales */}
                    <CircuitForm
                        isOpen={isCircuitFormOpen}
                        onClose={closeCircuitForm}
                        circuit={editingCircuit}
                        zonal={zonal}
                    />
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-circuito-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateCircuitDialog}
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
