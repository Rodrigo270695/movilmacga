import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { ExpandableButton } from '@/components/ui/expandable-button';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Contact } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OperatorForm } from '@/components/dcs/operators/operator-form';
import { OperatorsTable } from '@/components/dcs/operators/operators-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';

interface Operator {
    id: number;
    name: string;
    description?: string | null;
    status?: boolean;
    created_at: string;
}

interface PaginatedOperators {
    data: Operator[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    operators: PaginatedOperators;
    filters?: {
        search?: string;
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
        title: 'Operadores',
        href: '/dcs/operators',
    },
];

export default function OperatorsIndex({ operators, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [isOperatorFormOpen, setIsOperatorFormOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

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

    const openCreateOperatorDialog = () => {
        if (!hasPermission('gestor-operador-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear operadores.',
                duration: 4000
            });
            return;
        }
        setEditingOperator(null);
        setIsOperatorFormOpen(true);
    };

    const openEditOperatorDialog = (operator: Operator) => {
        if (!hasPermission('gestor-operador-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar operadores.',
                duration: 4000
            });
            return;
        }
        setEditingOperator(operator);
        setIsOperatorFormOpen(true);
    };

    const closeOperatorForm = () => {
        setIsOperatorFormOpen(false);
        setEditingOperator(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operadores" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Operadores
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Administra los operadores del sistema
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{operators.total} operadores</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{operators.data.filter(o => o.status).length} activos</span>
                                        </div>
                                        {operators.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {operators.current_page}/{operators.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {hasPermission('gestor-operador-crear') && (
                                    <div className="hidden sm:block">
                                        <ExpandableButton
                                            icon={Contact}
                                            text="Nuevo Operador"
                                            variant="glow"
                                            onClick={openCreateOperatorDialog}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <OperatorsTable
                        operators={operators}
                        onEdit={openEditOperatorDialog}
                        userPermissions={userPermissions}
                        filters={filters}
                    />

                    <OperatorForm
                        isOpen={isOperatorFormOpen}
                        onClose={closeOperatorForm}
                        operator={editingOperator}
                    />
                </div>

                {hasPermission('gestor-operador-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateOperatorDialog}
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
