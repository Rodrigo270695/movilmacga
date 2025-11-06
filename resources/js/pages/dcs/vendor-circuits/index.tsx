import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { VendorCircuitsTable } from '@/components/dcs/vendor-circuits/vendor-circuits-table';
import { VendorAssignmentModal } from '@/components/dcs/vendor-circuits/vendor-assignment-modal';
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
    business_id: number;
    business: Business;
}

interface UserCircuitAssignment {
    id: number;
    user_id: number;
    assigned_date: string;
    priority: number;
    notes?: string;
    user: User;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    status: boolean;
    zonal: Zonal;
    active_user_circuits?: UserCircuitAssignment[];
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
    vendors: User[];
    businesses: Business[];
    zonals: Zonal[];
    filters: {
        search?: string;
        business?: string;
        zonal?: string;
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
        title: 'Vendedor-Circuito',
        href: '/dcs/vendor-circuits',
    },
];

export default function VendorCircuitsIndex({ circuits, vendors, businesses, zonals, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
    const [modalMode, setModalMode] = useState<'assign' | 'reassign'>('assign');

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Calcular estadísticas
    const totalComplete = circuits.data.filter(circuit =>
        circuit.active_user_circuits && circuit.active_user_circuits.length === 3
    ).length;
    const totalPartial = circuits.data.filter(circuit =>
        circuit.active_user_circuits && circuit.active_user_circuits.length > 0 && circuit.active_user_circuits.length < 3
    ).length;
    const totalUnassigned = circuits.data.filter(circuit =>
        !circuit.active_user_circuits || circuit.active_user_circuits.length === 0
    ).length;
    const totalVendorAssignments = circuits.data.reduce((total, circuit) =>
        total + (circuit.active_user_circuits?.length || 0), 0
    );

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



    const openAssignDialog = (circuit: Circuit) => {
        if (!hasPermission('gestor-vendedor-circuito-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para asignar vendedores.',
                duration: 4000
            });
            return;
        }
        setSelectedCircuit(circuit);
        setModalMode('assign');
        setIsAssignmentModalOpen(true);
    };

    const openReassignDialog = (circuit: Circuit) => {
        if (!hasPermission('gestor-vendedor-circuito-asignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para reasignar vendedores.',
                duration: 4000
            });
            return;
        }
        setSelectedCircuit(circuit);
        setModalMode('reassign');
        setIsAssignmentModalOpen(true);
    };

    const closeAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
        setSelectedCircuit(null);
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
            <Head title="Gestión Vendedor-Circuito" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Profesional y limpio */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                    Gestión Vendedor-Circuito
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Administra las asignaciones de vendedores a circuitos del sistema
                                </p>

                                {/* Estadísticas mejoradas */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>{circuits.total} circuitos</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{totalComplete} completos (3/3)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span>{totalPartial} parciales (1-2)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span>{totalUnassigned} sin vendedores</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>{totalVendorAssignments} asignaciones totales</span>
                                    </div>
                                    {circuits.last_page > 1 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                            <span>Página {circuits.current_page} de {circuits.last_page}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla principal */}
                    <VendorCircuitsTable
                        circuits={circuits}
                        businesses={businesses}
                        zonals={zonals}
                        filters={filters}
                        onAssign={openAssignDialog}
                        onReassign={openReassignDialog}
                        onError={handleAssignmentError}
                        userPermissions={userPermissions}
                    />

                    {/* Modal de asignación */}
                    {isAssignmentModalOpen && selectedCircuit && (
                        <VendorAssignmentModal
                            circuit={selectedCircuit}
                            vendors={vendors}
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
