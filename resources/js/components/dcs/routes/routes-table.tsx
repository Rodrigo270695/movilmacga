import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import {
    Route,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Calendar,
    Hash
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface RouteModel {
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

interface PaginatedRoutes {
    data: RouteModel[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface RoutesTableProps {
    routes: PaginatedRoutes;
    circuit?: Circuit;
    onEdit: (route: RouteModel) => void;
    onToggleStatus?: (route: RouteModel) => void;
    isGlobalView?: boolean;
}

export function RoutesTable({ routes, circuit, onEdit, onToggleStatus, isGlobalView = false }: RoutesTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmToggleRoute, setConfirmToggleRoute] = useState<RouteModel | null>(null);

    // Función para verificar permisos (simplificada por ahora)
    const hasPermission = (permission: string): boolean => {
        // TODO: Implementar verificación real de permisos
        return true;
    };

    // Filtrar rutas basado en el término de búsqueda
    const filteredRoutes = useMemo(() => {
        if (!searchTerm) return routes.data;

        return routes.data.filter((route) => {
            const search = searchTerm.toLowerCase();
            const matchesName = route.name.toLowerCase().includes(search);
            const matchesCode = route.code.toLowerCase().includes(search);
            const status = route.status === true || route.status === 1 ? 'activo' : 'inactivo';
            const matchesStatus = status.includes(search);

            return matchesName || matchesCode || matchesStatus;
        });
    }, [routes.data, searchTerm]);

    const handleToggleStatus = (route: RouteModel) => {
        if (!hasPermission('gestor-ruta-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de rutas.',
                duration: 4000
            });
            return;
        }

        if (onToggleStatus) {
            onToggleStatus(route);
        } else {
            setConfirmToggleRoute(route);
        }
    };

    const closeConfirmToggle = () => {
        setConfirmToggleRoute(null);
    };

        const handlePageChange = (page: number) => {
        const routeName = isGlobalView ? 'dcs.routes.index' : 'dcs.zonales.circuits.routes.index';
        const routeParams = isGlobalView ? {} : [circuit?.zonal?.id, circuit?.id];

        router.get(route(routeName, routeParams), {
            page,
            per_page: routes.per_page
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => {
                addToast({
                    type: 'info',
                    title: 'Cargando página',
                    message: `Página ${page}`,
                    duration: 2000
                });
            }
        });
    };

        const handlePerPageChange = (perPage: number) => {
        const routeName = isGlobalView ? 'dcs.routes.index' : 'dcs.zonales.circuits.routes.index';
        const routeParams = isGlobalView ? {} : [circuit?.zonal?.id, circuit?.id];

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

    // Componente para las acciones de cada ruta
    const RouteActions = ({ route }: { route: RouteModel }) => {
        const actions = [];

        // Botón de editar
        if (hasPermission('gestor-ruta-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(route)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                    title="Editar ruta"
                >
                    <Edit className="w-3 h-3 text-blue-600" />
                </Button>
            );
        }

        // Botón de toggle status
        if (hasPermission('gestor-ruta-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(route)}
                    className={`h-8 w-8 p-0 cursor-pointer ${
                        route.status
                            ? "hover:bg-red-50 hover:border-red-200"
                            : "hover:bg-green-50 hover:border-green-200"
                    }`}
                    title={route.status ? 'Desactivar ruta' : 'Activar ruta'}
                >
                    <Power className={`w-3 h-3 ${
                        route.status ? "text-red-600" : "text-green-600"
                    }`} />
                </Button>
            );
        }

        return actions;
    };

    return (
        <>
            <Card className="overflow-hidden">
                {/* Header con búsqueda */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Route className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Rutas {!isGlobalView && circuit && `de ${circuit.name}`}
                            </h3>
                            <span className="text-sm text-gray-500">
                                {routes.total} total
                            </span>
                        </div>

                        {/* Búsqueda */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nombre, código o estado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-8"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
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
                                    Ruta
                                </th>
                                {isGlobalView && (
                                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Circuito
                                    </th>
                                )}
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha de Creación
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRoutes.map((route) => {
                                const statusConfig = getStatusConfig(route.status);
                                const actions = RouteActions({ route });

                                return (
                                    <tr key={route.id} className="hover:bg-gray-50">
                                        {/* Ruta */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <Route className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {route.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Circuito (solo en vista global) */}
                                        {isGlobalView && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm text-gray-900">
                                                    {route.circuit?.name || 'N/A'}
                                                </div>
                                                {route.circuit?.zonal && (
                                                    <div className="text-xs text-gray-500">
                                                        {route.circuit.zonal.name}
                                                    </div>
                                                )}
                                            </td>
                                        )}

                                        {/* Código */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Hash className="w-3 h-3 text-gray-400" />
                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {route.code}
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
                                                {formatDate(route.created_at)}
                                            </div>
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
                <div className="sm:hidden space-y-4 p-4">
                    {filteredRoutes.map((route) => {
                        const statusConfig = getStatusConfig(route.status);
                        const actions = RouteActions({ route });

                        return (
                            <Card key={route.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Route className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {route.name}
                                            </h4>
                                            {isGlobalView && route.circuit && (
                                                <p className="text-xs text-gray-500">
                                                    Circuito: {route.circuit.name}
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
                                        {route.code}
                                    </span>
                                </div>

                                {/* Fecha de registro */}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    Creado: {formatDate(route.created_at)}
                                </div>

                                {/* Acciones */}
                                {actions.length > 0 && (
                                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                                        {actions}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Mensaje cuando no hay rutas */}
                {filteredRoutes.length === 0 && (
                    <div className="text-center py-12">
                        <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'No se encontraron rutas' : 'No hay rutas'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm
                                ? `No se encontraron rutas que coincidan con "${searchTerm}"`
                                : 'Comienza creando tu primera ruta para este circuito.'
                            }
                        </p>
                    </div>
                )}

                {/* Paginación */}
                {routes.last_page > 1 && (
                    <Pagination
                        data={routes}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de confirmación (solo en vista jerárquica) */}
            {!isGlobalView && (
                <ConfirmToggleModal
                    isOpen={!!confirmToggleRoute}
                    onClose={closeConfirmToggle}
                    route={confirmToggleRoute}
                    circuit={circuit}
                />
            )}
        </>
    );
}
