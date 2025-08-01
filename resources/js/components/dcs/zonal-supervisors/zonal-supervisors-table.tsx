import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-unassign-modal';
import {
    Search,
    X,
    Building2,
    UserPlus,
    UserX,
    RotateCcw,
    MapPin,
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    Users,
    Filter
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';

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

interface ZonalSupervisorAssignment {
    id: number;
    user_id: number;
    assigned_at: string;
    notes?: string;
    supervisor: User;
}

interface Zonal {
    id: number;
    name: string;
    status: boolean;
    business: Business;
    active_zonal_supervisor?: ZonalSupervisorAssignment;
}

interface PaginatedZonals {
    data: Zonal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    zonals: PaginatedZonals;
    businesses: Business[];
    filters: {
        search?: string;
        business?: string;
        status?: string;
        per_page?: number;
    };
    onAssign: (zonal: Zonal) => void;
    onReassign: (zonal: Zonal) => void;
    onError: (message: string) => void;
    userPermissions: string[];
}

export function ZonalSupervisorsTable({
    zonals,
    businesses,
    filters,
    onAssign,
    onReassign,
    onError,
    userPermissions
}: Props) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [businessFilter, setBusinessFilter] = useState(filters.business || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [confirmUnassign, setConfirmUnassign] = useState<{ zonal: Zonal; assignmentId: number } | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };



    // Debounce para búsqueda (solo cuando cambian los filtros, resetea a página 1)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (businessFilter && businessFilter !== 'all') params.set('business', businessFilter);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (filters.per_page) params.set('per_page', filters.per_page.toString());
            // Resetear a página 1 cuando cambian los filtros
            params.set('page', '1');

        router.get(route('dcs.zonal-supervisors.index'), Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, businessFilter, statusFilter]);

    // Limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setBusinessFilter('all');
        setStatusFilter('all');

        router.get(route('dcs.zonal-supervisors.index'), {
            per_page: filters.per_page
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Filtros activos
    const hasActiveFilters = searchTerm || (businessFilter && businessFilter !== 'all') || (statusFilter && statusFilter !== 'all');

    const handleUnassign = (zonal: Zonal) => {
        if (!hasPermission('gestor-zonal-supervisor-desasignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para desasignar supervisores.',
                duration: 4000
            });
            return;
        }
        if (!zonal.active_zonal_supervisor) return;
        setConfirmUnassign({ zonal, assignmentId: zonal.active_zonal_supervisor.id });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Componente para las acciones de cada zonal
    const ZonalActions = ({ zonal }: { zonal: Zonal }) => {
        const actions = [];
        const hasAssignedSupervisor = !!zonal.active_zonal_supervisor;

        if (hasPermission('gestor-zonal-supervisor-asignar')) {
            if (hasAssignedSupervisor) {
                actions.push(
                    <Button
                        key="reassign"
                        variant="outline"
                        size="sm"
                        onClick={() => onReassign(zonal)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                        title="Reasignar supervisor"
                    >
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                    </Button>
                );
            } else {
                actions.push(
                    <Button
                        key="assign"
                        variant="outline"
                        size="sm"
                        onClick={() => onAssign(zonal)}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer"
                        title="Asignar supervisor"
                    >
                        <UserPlus className="w-4 h-4 text-green-600" />
                    </Button>
                );
            }
        }

        if (hasPermission('gestor-zonal-supervisor-desasignar') && hasAssignedSupervisor) {
            actions.push(
                <Button
                    key="unassign"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnassign(zonal)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                    title="Desasignar supervisor"
                >
                    <UserX className="w-4 h-4 text-red-600" />
                </Button>
            );
        }

        return actions;
    };

    const getStatusBadge = (zonal: Zonal) => {
        const hasAssignedSupervisor = !!zonal.active_zonal_supervisor;
        return (
            <Badge
                variant={hasAssignedSupervisor ? "default" : "secondary"}
                className={`
                    ${hasAssignedSupervisor
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }
                    font-medium transition-colors
                `}
            >
                {hasAssignedSupervisor ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Asignado</>
                ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Sin asignar</>
                )}
            </Badge>
        );
    };

    const getStatusConfig = (zonal: Zonal) => {
        const hasAssignedSupervisor = !!zonal.active_zonal_supervisor;

        if (hasAssignedSupervisor) {
            return {
                text: 'Asignado',
                icon: CheckCircle2,
                className: 'bg-green-100 text-green-800 border-green-200'
            };
        } else {
            return {
                text: 'Sin asignar',
                icon: XCircle,
                className: 'bg-gray-100 text-gray-600 border-gray-200'
            };
        }
    };

    return (
        <>
            <Card className="bg-white border border-gray-200 shadow-sm">
                {/* Header de la tabla - Responsive */}
                <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Asignaciones Supervisor-Zonal</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {zonals.total} total
                            </Badge>
                        </div>

                        {/* Filtros - Responsive */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                            {/* Buscador */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filtro por empresa */}
                            <div className="w-full sm:w-48">
                                <Select value={businessFilter} onValueChange={setBusinessFilter}>
                                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las empresas</SelectItem>
                                        {businesses.map((business) => (
                                            <SelectItem key={business.id} value={business.name}>
                                                {business.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro por estado */}
                            <div className="w-full sm:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="assigned">Con supervisor</SelectItem>
                                        <SelectItem value="unassigned">Sin supervisor</SelectItem>
                                    </SelectContent>
                                </Select>
                        </div>

                            {/* Limpiar filtros */}
                            {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                    className="whitespace-nowrap"
                            >
                                <X className="w-4 h-4 mr-2" />
                                    Limpiar
                            </Button>
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
                                    Zonal
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supervisor
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asignación
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {zonals.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">
                                            {hasActiveFilters ? 'No se encontraron zonales' : 'No hay zonales registrados'}
                                        </p>
                                        <p className="text-sm">
                                            {hasActiveFilters
                                                ? 'Intenta con filtros diferentes'
                                                : 'Los zonales aparecerán aquí cuando estén disponibles'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                zonals.data.map((zonal: Zonal) => (
                                    <tr key={zonal.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Zonal */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {zonal.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {zonal.business.name}
                                                    </div>
                                                    </div>
                                                </div>
                                            </td>

                                        {/* Supervisor */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                {zonal.active_zonal_supervisor ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <User className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {zonal.active_zonal_supervisor.supervisor.first_name} {zonal.active_zonal_supervisor.supervisor.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {zonal.active_zonal_supervisor.supervisor.email}
                                                        </div>
                                                    </div>
                                                    </div>
                                                ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500 italic">
                                                            Sin supervisor
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            No asignado
                                                        </div>
                                                    </div>
                                                </div>
                                                )}
                                            </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(zonal)}
                                            </td>

                                        {/* Asignación */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {zonal.active_zonal_supervisor ? (
                                                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(zonal.active_zonal_supervisor.assigned_at)}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                            </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ZonalActions zonal={zonal} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>

                {/* Vista Mobile - Tarjetas */}
                <div className="sm:hidden">
                    {zonals.data.map((zonal: Zonal) => {
                        const statusConfig = getStatusConfig(zonal);
                        const actions = ZonalActions({ zonal });

                        return (
                            <div key={zonal.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="p-4 space-y-3">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {zonal.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {zonal.business.name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Información del supervisor */}
                                    <div className="space-y-2">
                                        {zonal.active_zonal_supervisor ? (
                                            <>
                                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span>{zonal.active_zonal_supervisor.supervisor.first_name} {zonal.active_zonal_supervisor.supervisor.last_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>Asignado: {formatDate(zonal.active_zonal_supervisor.assigned_at)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-gray-500 italic">
                                                <User className="w-3 h-3 text-gray-400" />
                                                <span>Sin supervisor asignado</span>
                                            </div>
                                        )}
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

                    {/* Paginación */}
                    {zonals.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                        <Pagination
                            data={zonals}
                            onPageChange={(page) => {
                                const params = new URLSearchParams();
                                params.set('page', page.toString());
                                if (searchTerm) params.set('search', searchTerm);
                                if (businessFilter && businessFilter !== 'all') params.set('business', businessFilter);
                                if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
                                if (filters.per_page) params.set('per_page', filters.per_page.toString());

                                router.get(route('dcs.zonal-supervisors.index'), Object.fromEntries(params), {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('dcs.zonal-supervisors.index'), { per_page: perPage, page: 1 }, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                        />
                    </div>
                )}
            </Card>

            {/* Modal de confirmación */}
            {confirmUnassign && (
                <ConfirmToggleModal
                    isOpen={true}
                    onClose={() => setConfirmUnassign(null)}
                    zonal={confirmUnassign.zonal}
                    assignmentId={confirmUnassign.assignmentId}
                />
            )}
        </>
    );
}
