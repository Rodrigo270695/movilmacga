import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmUnassignModal } from './confirm-unassign-modal';
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
    CircuitBoard,
    Filter,
    Truck
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
    businesses: Business[];
    zonals: Zonal[];
    filters: {
        search?: string;
        business?: string;
        zonal?: string;
        status?: string;
        per_page?: number;
    };
    onAssign: (circuit: Circuit) => void;
    onReassign: (circuit: Circuit) => void;
    onError: (message: string) => void;
    userPermissions: string[];
}

export function VendorCircuitsTable({
    circuits,
    businesses,
    zonals,
    filters,
    onAssign,
    onReassign,
    onError,
    userPermissions
}: Props) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [businessFilter, setBusinessFilter] = useState(filters.business || 'all');
    const [zonalFilter, setZonalFilter] = useState(filters.zonal || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [confirmUnassign, setConfirmUnassign] = useState<{ circuit: Circuit; assignmentId: number } | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Filtrar zonales por negocio seleccionado
    const filteredZonals = useMemo(() => {
        if (businessFilter === 'all') return zonals;
        const selectedBusiness = businesses.find(b => b.name === businessFilter);
        return selectedBusiness ? zonals.filter(z => z.business_id === selectedBusiness.id) : [];
    }, [businessFilter, businesses, zonals]);

    // Debounce para búsqueda (solo cuando cambian los filtros, resetea a página 1)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (businessFilter && businessFilter !== 'all') params.set('business', businessFilter);
            if (zonalFilter && zonalFilter !== 'all') params.set('zonal', zonalFilter);
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (filters.per_page) params.set('per_page', filters.per_page.toString());
            // Resetear a página 1 cuando cambian los filtros
            params.set('page', '1');

            router.get(route('dcs.vendor-circuits.index'), Object.fromEntries(params), {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, businessFilter, zonalFilter, statusFilter]);

    // Limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setBusinessFilter('all');
        setZonalFilter('all');
        setStatusFilter('all');

        router.get(route('dcs.vendor-circuits.index'), {
            per_page: filters.per_page
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Filtros activos
    const hasActiveFilters = searchTerm || (businessFilter && businessFilter !== 'all') || (zonalFilter && zonalFilter !== 'all') || (statusFilter && statusFilter !== 'all');

    const handleUnassign = (circuit: Circuit) => {
        if (!hasPermission('gestor-vendedor-circuito-desasignar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para desasignar vendedores.',
                duration: 4000
            });
            return;
        }
        const assignment = circuit.active_user_circuits?.[0];
        if (!assignment) return;
        setConfirmUnassign({ circuit, assignmentId: assignment.id });
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
        const hasAssignedVendor = !!(circuit.active_user_circuits && circuit.active_user_circuits.length > 0);

        if (hasPermission('gestor-vendedor-circuito-asignar')) {
            if (hasAssignedVendor) {
                actions.push(
                    <Button
                        key="reassign"
                        variant="outline"
                        size="sm"
                        onClick={() => onReassign(circuit)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                        title="Reasignar vendedor"
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
                        onClick={() => onAssign(circuit)}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer"
                        title="Asignar vendedor"
                    >
                        <UserPlus className="w-4 h-4 text-green-600" />
                    </Button>
                );
            }
        }

        if (hasPermission('gestor-vendedor-circuito-desasignar') && hasAssignedVendor) {
            actions.push(
                <Button
                    key="unassign"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnassign(circuit)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                    title="Desasignar vendedor"
                >
                    <UserX className="w-4 h-4 text-red-600" />
                </Button>
            );
        }

        return actions;
    };

    const getStatusBadge = (circuit: Circuit) => {
        const hasAssignedVendor = !!(circuit.active_user_circuits && circuit.active_user_circuits.length > 0);
        return (
            <Badge
                variant={hasAssignedVendor ? "default" : "secondary"}
                className={`
                    ${hasAssignedVendor
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }
                    font-medium transition-colors
                `}
            >
                {hasAssignedVendor ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Asignado</>
                ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Sin asignar</>
                )}
            </Badge>
        );
    };

    const getStatusConfig = (circuit: Circuit) => {
        const hasAssignedVendor = !!(circuit.active_user_circuits && circuit.active_user_circuits.length > 0);

        if (hasAssignedVendor) {
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
                {/* Header de la tabla */}
                <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <CircuitBoard className="w-5 h-5 text-gray-600" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Asignaciones Vendedor-Circuito</h3>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                            {circuits.total} total
                        </Badge>
                    </div>

                    {/* Filtros organizados */}
                    <div className="space-y-3">
                        {/* Buscador principal */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar circuitos..."
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

                        {/* Filtros responsivos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 lg:gap-3">
                            {/* Filtro por empresa */}
                            <div className="w-full sm:w-auto lg:w-48">
                                <Select value={businessFilter} onValueChange={setBusinessFilter}>
                                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm h-9">
                                        <Building2 className="w-4 h-4 mr-2 text-gray-500" />
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

                            {/* Filtro por zonal */}
                            <div className="w-full sm:w-auto lg:w-48">
                                <Select value={zonalFilter} onValueChange={setZonalFilter}>
                                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm h-9">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                        <SelectValue placeholder="Zonal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los zonales</SelectItem>
                                        {filteredZonals.map((zonal) => (
                                            <SelectItem key={zonal.id} value={zonal.name}>
                                                {zonal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro por estado */}
                            <div className="w-full sm:w-auto lg:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm h-9">
                                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="assigned">Con vendedor</SelectItem>
                                        <SelectItem value="unassigned">Sin vendedor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Limpiar filtros */}
                            {hasActiveFilters && (
                                <div className="w-full sm:w-auto sm:col-span-2 lg:col-span-1">
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="w-full sm:w-auto h-9 px-3 text-sm border-gray-300 hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Limpiar filtros
                                    </Button>
                                </div>
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
                                    Circuito
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendedor
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
                            {circuits.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500">
                                        <CircuitBoard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">
                                            {hasActiveFilters ? 'No se encontraron circuitos' : 'No hay circuitos registrados'}
                                        </p>
                                        <p className="text-sm">
                                            {hasActiveFilters
                                                ? 'Intenta con filtros diferentes'
                                                : 'Los circuitos aparecerán aquí cuando estén disponibles'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                circuits.data.map((circuit: Circuit) => {
                                    const assignment = circuit.active_user_circuits?.[0];

                                    return (
                                        <tr key={circuit.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Circuito */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Truck className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {circuit.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {circuit.code} • {circuit.zonal.business.name} • {circuit.zonal.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Vendedor */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {assignment ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <User className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {assignment.user.first_name} {assignment.user.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {assignment.user.email}
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
                                                                Sin vendedor
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
                                                {getStatusBadge(circuit)}
                                            </td>

                                            {/* Asignación */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {assignment ? (
                                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(assignment.assigned_date)}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <CircuitActions circuit={circuit} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vista Mobile - Tarjetas */}
                <div className="sm:hidden">
                    {circuits.data.map((circuit: Circuit) => {
                        const assignment = circuit.active_user_circuits?.[0];
                        const statusConfig = getStatusConfig(circuit);
                        const actions = CircuitActions({ circuit });

                        return (
                            <div key={circuit.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="p-4 space-y-3">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {circuit.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {circuit.code} • {circuit.zonal.business.name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Información del vendedor */}
                                    <div className="space-y-2">
                                        {assignment ? (
                                            <>
                                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span>{assignment.user.first_name} {assignment.user.last_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>Asignado: {formatDate(assignment.assigned_date)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-gray-500 italic">
                                                <User className="w-3 h-3 text-gray-400" />
                                                <span>Sin vendedor asignado</span>
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
                {circuits.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                        <Pagination
                            data={circuits}
                            onPageChange={(page) => {
                                const params = new URLSearchParams();
                                params.set('page', page.toString());
                                if (searchTerm) params.set('search', searchTerm);
                                if (businessFilter && businessFilter !== 'all') params.set('business', businessFilter);
                                if (zonalFilter && zonalFilter !== 'all') params.set('zonal', zonalFilter);
                                if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
                                if (filters.per_page) params.set('per_page', filters.per_page.toString());

                                router.get(route('dcs.vendor-circuits.index'), Object.fromEntries(params), {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('dcs.vendor-circuits.index'), { per_page: perPage, page: 1 }, {
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
                <ConfirmUnassignModal
                    isOpen={true}
                    onClose={() => setConfirmUnassign(null)}
                    circuit={confirmUnassign.circuit}
                    assignment={confirmUnassign.circuit.active_user_circuits![0]}
                    onError={onError}
                />
            )}
        </>
    );
}
