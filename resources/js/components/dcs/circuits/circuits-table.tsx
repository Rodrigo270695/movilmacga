import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import {
    CircuitBoard,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Calendar,
    Hash,
    Route
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

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

interface CircuitsTableProps {
    circuits: PaginatedCircuits;
    zonal?: Zonal;
    onEdit: (circuit: Circuit) => void;
    userPermissions?: string[];
    onToggleStatus?: (circuit: Circuit) => void;
    isGlobalView?: boolean;
}

export function CircuitsTable({ circuits, zonal, onEdit, userPermissions = [], onToggleStatus, isGlobalView = false }: CircuitsTableProps) {
    const { addToast } = useToast();
    const [confirmToggleCircuit, setConfirmToggleCircuit] = useState<Circuit | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };



    const handleToggleStatus = (circuit: Circuit) => {
        if (!hasPermission('gestor-circuito-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de circuitos.',
                duration: 4000
            });
            return;
        }

        if (onToggleStatus) {
            onToggleStatus(circuit);
        } else {
            setConfirmToggleCircuit(circuit);
        }
    };

    const closeConfirmToggle = () => {
        setConfirmToggleCircuit(null);
    };

    const handlePageChange = (page: number) => {
        const routeName = isGlobalView ? 'dcs.circuits.index' : 'dcs.zonales.circuits.index';
        const routeParams = isGlobalView ? {} : { zonal: zonal?.id };

        router.get(route(routeName, routeParams), {
            page,
            per_page: circuits.per_page
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => {
                addToast({
                    type: 'info',
                    title: 'Cargando...',
                    message: `Navegando a la página ${page}`,
                    duration: 2000
                });
            }
        });
    };

    const handlePerPageChange = (perPage: number) => {
        const routeName = isGlobalView ? 'dcs.circuits.index' : 'dcs.zonales.circuits.index';
        const routeParams = isGlobalView ? {} : { zonal: zonal?.id };

        router.get(route(routeName, routeParams), {
            page: 1, // Reset to first page when changing per_page
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => {
                addToast({
                    type: 'info',
                    title: 'Actualizando vista',
                    message: `Mostrando ${perPage} elementos por página`,
                    duration: 2000
                });
            }
        });
    };

    const getStatusConfig = (status?: boolean | number) => {
        // Verificar si está inactivo (false, 0, o null)
        if (status === false || status === 0 || status === null) {
            return {
                variant: 'secondary' as const,
                icon: XCircle,
                text: 'Inactivo',
                className: 'text-red-700 bg-red-50 border-red-200'
            };
        }
        return {
            variant: 'secondary' as const,
            icon: CheckCircle2,
            text: 'Activo',
            className: 'text-green-700 bg-green-50 border-green-200'
        };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Componente para las acciones de cada circuito
    const CircuitActions = ({ circuit }: { circuit: Circuit }) => {
        const actions = [];

        if (hasPermission('gestor-circuito-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(circuit)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                    title="Editar circuito"
                >
                    <Edit className="w-4 h-4 text-blue-600" />
                </Button>
            );
        }



        if (hasPermission('gestor-circuito-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(circuit)}
                    className={`h-8 w-8 p-0 cursor-pointer ${
                        (circuit.status === false || circuit.status === 0 || circuit.status === null)
                            ? "hover:bg-green-50 hover:border-green-200"
                            : "hover:bg-red-50 hover:border-red-200"
                    }`}
                    title={(circuit.status === false || circuit.status === 0 || circuit.status === null) ? "Activar circuito" : "Desactivar circuito"}
                >
                    <Power className={`w-4 h-4 ${
                        (circuit.status === false || circuit.status === 0 || circuit.status === null)
                            ? "text-green-600"
                            : "text-red-600"
                    }`} />
                </Button>
            );
        }

        return actions;
    };

    return (
        <>
            <Card className="bg-white border border-gray-200 shadow-sm">
                {/* Header de la tabla - Responsive */}
                <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-3">
                            <CircuitBoard className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">
                                {isGlobalView ? 'Todos los Circuitos' : `Circuitos de ${zonal?.name || 'N/A'}`}
                            </h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {circuits.total} total
                            </Badge>
                        </div>


                    </div>
                </div>

                {/* Vista Desktop - Tabla */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        {/* Header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Circuito
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha de Creación
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rutas
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {circuits.data.map((circuit) => {
                                const statusConfig = getStatusConfig(circuit.status);
                                const actions = CircuitActions({ circuit });

                                return (
                                    <tr key={circuit.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Circuito */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                                    <CircuitBoard className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {circuit.name}
                                                    </div>
                                                    {isGlobalView && circuit.zonal && (
                                                        <div className="text-xs text-gray-500">
                                                            Zonal: {circuit.zonal.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Código */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Hash className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                    {circuit.code}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={statusConfig.className}>
                                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                                {statusConfig.text}
                                            </Badge>
                                        </td>

                                        {/* Fecha de creación */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm text-gray-900">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                {formatDate(circuit.created_at)}
                                            </div>
                                        </td>

                                        {/* Rutas */}
                                        <td className="px-6 py-4 text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (isGlobalView) {
                                                        // Vista global: usar ruta global con filtro de circuit_id
                                                        router.visit(route('dcs.routes.index', { circuit_id: circuit.id }));
                                                    } else {
                                                        // Vista jerárquica: usar ruta específica del zonal
                                                        router.visit(route('dcs.zonales.circuits.routes.index', [zonal?.id, circuit.id]));
                                                    }
                                                }}
                                                className="h-8 px-3 text-xs hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer"
                                                title={`Ver rutas de ${circuit.name}`}
                                            >
                                                <Route className="w-3 h-3 mr-1.5 text-emerald-600" />
                                                {circuit.routes_count || 0}
                                            </Button>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {actions}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Vista Mobile - Cards */}
                <div className="sm:hidden divide-y divide-gray-200">
                    {circuits.data.map((circuit) => {
                        const statusConfig = getStatusConfig(circuit.status);
                        const actions = CircuitActions({ circuit });

                        return (
                            <div key={circuit.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header del card */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <CircuitBoard className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {circuit.name}
                                                </h4>
                                                {isGlobalView && circuit.zonal && (
                                                    <p className="text-xs text-gray-500">
                                                        Zonal: {circuit.zonal.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Código */}
                                    <div className="flex items-center gap-1 text-xs">
                                        <Hash className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-500">Código:</span>
                                        <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            {circuit.code}
                                        </span>
                                    </div>

                                    {/* Fecha de registro y Rutas */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            Creado: {formatDate(circuit.created_at)}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (isGlobalView) {
                                                    // Vista global: usar ruta global con filtro de circuit_id
                                                    router.visit(route('dcs.routes.index', { circuit_id: circuit.id }));
                                                } else {
                                                    // Vista jerárquica: usar ruta específica del zonal
                                                    router.visit(route('dcs.zonales.circuits.routes.index', [zonal?.id, circuit.id]));
                                                }
                                            }}
                                            className="h-7 px-2.5 text-xs hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer"
                                            title={`Ver rutas de ${circuit.name}`}
                                        >
                                            <Route className="w-3 h-3 mr-1 text-emerald-600" />
                                            {circuit.routes_count || 0}
                                        </Button>
                                    </div>

                                    {/* Acciones */}
                                    {actions.length > 0 && (
                                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                                            {actions}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Estado vacío */}
                {circuits.data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <CircuitBoard className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    No hay circuitos en esta página
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {isGlobalView
                                            ? 'Crea nuevos circuitos desde el botón superior'
                                            : `Crea circuitos para el zonal ${zonal?.name || 'seleccionado'}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paginación */}
                {circuits.last_page > 1 && (
                    <Pagination
                        data={circuits}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de confirmación (solo en vista jerárquica) */}
            {!isGlobalView && (
                <ConfirmToggleModal
                    isOpen={!!confirmToggleCircuit}
                    onClose={closeConfirmToggle}
                    circuit={confirmToggleCircuit}
                                            zonal={zonal!}
                />
            )}
        </>
    );
}
