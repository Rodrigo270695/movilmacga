import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import {
    Route,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Calendar,
    Hash,
    MapPin,
    Map,
    Radio
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    telegestion?: boolean;
    circuit_id: number;
    created_at: string;
    pdvs_count?: number; // Conteo total de PDVs
    active_pdvs_count?: number; // Conteo de PDVs activos (vende)
    thisWeekVisits?: Array<{
        visit_date: string;
    }>; // Fechas de visita de esta semana
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
    onManageVisitDates?: (route: RouteModel) => void;
    onViewVisitDates?: (route: RouteModel) => void;
    onViewMap?: (route: RouteModel) => void;
    isGlobalView?: boolean;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function RoutesTable({ routes, circuit, onEdit, onToggleStatus, onManageVisitDates, onViewVisitDates, onViewMap, isGlobalView = false, onPageChange: parentPageChange, onPerPageChange: parentPerPageChange }: RoutesTableProps) {
    const { addToast } = useToast();
    const [confirmToggleRoute, setConfirmToggleRoute] = useState<RouteModel | null>(null);

    // Función para navegar a PDVs con filtro de ruta y estado "vende"
    const handleViewPdvs = (route: RouteModel) => {
        router.visit(`/dcs/pdvs?route_id=${route.id}&status=vende`);
    };

    // Función para navegar a todos los PDVs de la ruta (sin filtro de estado)
    const handleViewAllPdvs = (route: RouteModel) => {
        router.visit(`/dcs/pdvs?route_id=${route.id}`);
    };

    // Función para verificar permisos (simplificada por ahora)
    const hasPermission = (permission: string): boolean => {
        // TODO: Implementar verificación real de permisos
        return true;
    };



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
        // Si el padre provee manejador, usarlo (para vista global con filtros)
        if (parentPageChange) {
            parentPageChange(page);
            return;
        }

        // Fallback para vista jerárquica
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
        // Si el padre provee manejador, usarlo (para vista global con filtros)
        if (parentPerPageChange) {
            parentPerPageChange(perPage);
            return;
        }

        // Fallback para vista jerárquica
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

    const formatWeekDay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3);
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

        // Botón de fechas de visita
        if (hasPermission('gestor-ruta-fechas-visita') && onManageVisitDates) {
            actions.push(
                <Button
                    key="visit-dates"
                    variant="outline"
                    size="sm"
                    onClick={() => onManageVisitDates(route)}
                    className="h-8 w-8 p-0 hover:bg-purple-50 hover:border-purple-200 cursor-pointer"
                    title="Gestionar fechas de visita"
                >
                    <Calendar className="w-3 h-3 text-purple-600" />
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
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Telegestión
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PDVs
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Esta Semana
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {routes.data.map((route) => {
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
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {route.code}
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



                                        {/* Estado */}
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={statusConfig.className}>
                                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                                {statusConfig.text}
                                            </Badge>
                                        </td>

                                        {/* Telegestión */}
                                        <td className="px-6 py-4 text-center">
                                            {route.telegestion ? (
                                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                    <Radio className="w-3 h-3 mr-1" />
                                                    Sí
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                    <Radio className="w-3 h-3 mr-1 opacity-50" />
                                                    No
                                                </Badge>
                                            )}
                                        </td>

                                        {/* PDVs */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Botón único de PDVs con indicadores visuales */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewAllPdvs(route)}
                                                    className="flex items-center gap-2 px-3 py-1 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                                                    title={`Ver todos los PDVs de la ruta (${route.active_pdvs_count || 0} activos, ${(route.pdvs_count || 0) - (route.active_pdvs_count || 0)} inactivos)`}
                                                >
                                                    <MapPin className="w-3 h-3 text-blue-500" />

                                                    {/* PDVs Activos (Verde) */}
                                                    {(route.active_pdvs_count || 0) > 0 && (
                                                        <span className="text-green-600 font-medium">{route.active_pdvs_count || 0}</span>
                                                    )}

                                                    {/* Separador */}
                                                    {((route.pdvs_count || 0) - (route.active_pdvs_count || 0)) > 0 && (route.active_pdvs_count || 0) > 0 && (
                                                        <span className="text-gray-400">/</span>
                                                    )}

                                                    {/* PDVs Inactivos (Rojo) */}
                                                    {((route.pdvs_count || 0) - (route.active_pdvs_count || 0)) > 0 && (
                                                        <span className="text-red-600 font-medium">{(route.pdvs_count || 0) - (route.active_pdvs_count || 0)}</span>
                                                    )}
                                                </Button>

                                                {/* Botón del Mapa */}
                                                {onViewMap && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onViewMap(route)}
                                                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                                                        title="Ver mapa de PDVs activos"
                                                    >
                                                        <Map className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Fechas de esta semana */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {route.thisWeekVisits && route.thisWeekVisits.length > 0 ? (
                                                    <>
                                                        <div className="text-xs text-gray-700 font-medium">
                                                            {route.thisWeekVisits.slice(0, 3).map(visit =>
                                                                formatWeekDay(visit.visit_date)
                                                            ).join(', ')}
                                                            {route.thisWeekVisits.length > 3 && (
                                                                <span className="text-gray-500"> +{route.thisWeekVisits.length - 3}</span>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                            {route.thisWeekVisits.length} visitas
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
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
                    {routes.data.map((route) => {
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
                                            <p className="text-xs text-gray-500 font-mono">
                                                {route.code}
                                            </p>
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

                                {/* Telegestión (móvil) */}
                                <div className="flex items-center gap-2">
                                    <Radio className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">Telegestión:</span>
                                    {route.telegestion ? (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                            Sí
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                                            No
                                        </Badge>
                                    )}
                                </div>



                                                                {/* PDVs */}
                                <div className="flex items-center gap-1 text-xs">
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span className="text-gray-500">PDVs:</span>

                                    {/* Botón único de PDVs con indicadores visuales */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewAllPdvs(route)}
                                        className="h-6 px-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                                        title={`Ver todos los PDVs de la ruta (${route.active_pdvs_count || 0} activos, ${(route.pdvs_count || 0) - (route.active_pdvs_count || 0)} inactivos)`}
                                    >
                                        {/* PDVs Activos (Verde) */}
                                        {(route.active_pdvs_count || 0) > 0 && (
                                            <span className="text-green-600 font-medium">{route.active_pdvs_count || 0}</span>
                                        )}

                                        {/* Separador */}
                                        {((route.pdvs_count || 0) - (route.active_pdvs_count || 0)) > 0 && (route.active_pdvs_count || 0) > 0 && (
                                            <span className="text-gray-400 mx-1">/</span>
                                        )}

                                        {/* PDVs Inactivos (Rojo) */}
                                        {((route.pdvs_count || 0) - (route.active_pdvs_count || 0)) > 0 && (
                                            <span className="text-red-600 font-medium">{(route.pdvs_count || 0) - (route.active_pdvs_count || 0)}</span>
                                        )}
                                    </Button>
                                </div>

                                {/* Fechas de esta semana */}
                                <div className="flex items-center gap-1 text-xs">
                                    <Calendar className="w-3 h-3 text-purple-500" />
                                    <span className="text-gray-500">Esta semana:</span>
                                    {route.thisWeekVisits && route.thisWeekVisits.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-700 font-medium">
                                                {route.thisWeekVisits.slice(0, 2).map(visit =>
                                                    formatWeekDay(visit.visit_date)
                                                ).join(', ')}
                                                {route.thisWeekVisits.length > 2 && (
                                                    <span className="text-gray-500"> +{route.thisWeekVisits.length - 2}</span>
                                                )}
                                            </span>
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                {route.thisWeekVisits.length}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Sin visitas</span>
                                    )}
                                    {onViewMap && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewMap(route)}
                                            className="h-6 px-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer ml-2"
                                            title="Ver mapa"
                                        >
                                            <Map className="w-3 h-3" />
                                        </Button>
                                    )}
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
                {routes.data.length === 0 && (
                    <div className="text-center py-12">
                        <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay rutas
                        </h3>
                        <p className="text-gray-500">
                            Comienza creando tu primera ruta para este circuito.
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
