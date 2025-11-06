import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    FileCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    X,
    Calendar,
    MapPin,
    User,
    Filter,
    Building2,
    AlertCircle,
    Check,
    X as XIcon
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';

interface Route {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
    circuit?: Circuit;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    address: string;
    reference: string;
    latitude: number | null;
    longitude: number | null;
    route_id?: number;
    route?: Route;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id?: number;
    business?: Business;
}

interface ChangeRequest {
    id: number;
    pdv_id: number;
    user_id: number;
    zonal_id: number;
    status: 'pending' | 'approved' | 'rejected';
    original_data: {
        address?: string;
        reference?: string;
        latitude?: number;
        longitude?: number;
    };
    changes: {
        address?: string;
        reference?: string;
        latitude?: number;
        longitude?: number;
    };
    reason: string | null;
    rejection_reason: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    created_at: string;
    updated_at: string;
    pdv: Pdv;
    user: User;
    zonal: Zonal;
}

interface PaginatedChangeRequests {
    data: ChangeRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PdvChangeRequestsTableProps {
    changeRequests: PaginatedChangeRequests;
    availableZonals: Zonal[];
    userPermissions: string[];
    filters?: {
        search?: string;
        status?: string;
        zonal?: string;
        per_page?: number;
    };
}

export function PdvChangeRequestsTable({ 
    changeRequests, 
    availableZonals, 
    userPermissions, 
    filters 
}: PdvChangeRequestsTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'all');
    const [zonalFilter, setZonalFilter] = useState<string>(filters?.zonal || 'all');
    const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Para debounce de búsqueda
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Búsqueda automática con debounce
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            router.get(route('dcs.pdv-change-requests.index'), {
                search: searchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                zonal: zonalFilter !== 'all' ? zonalFilter : undefined,
                page: 1
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 500);

        setSearchDebounce(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [searchTerm]);

    // Manejar cambio de filtros
    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(route('dcs.pdv-change-requests.index'), {
            search: searchTerm || undefined,
            status: value !== 'all' ? value : undefined,
            zonal: zonalFilter !== 'all' ? zonalFilter : undefined,
            page: 1
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleZonalFilter = (value: string) => {
        setZonalFilter(value);
        router.get(route('dcs.pdv-change-requests.index'), {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            zonal: value !== 'all' ? value : undefined,
            page: 1
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setZonalFilter('all');
        router.get(route('dcs.pdv-change-requests.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleApprove = (request: ChangeRequest) => {
        if (!hasPermission('gestor-pdv-aprobaciones-aprobar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para aprobar solicitudes.',
                duration: 4000
            });
            return;
        }
        setSelectedRequest(request);
        setIsApproveModalOpen(true);
    };

    const handleReject = (request: ChangeRequest) => {
        if (!hasPermission('gestor-pdv-aprobaciones-rechazar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para rechazar solicitudes.',
                duration: 4000
            });
            return;
        }
        setSelectedRequest(request);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const confirmApprove = () => {
        if (!selectedRequest) return;

        router.post(route('dcs.pdv-change-requests.approve', selectedRequest.id), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                setIsApproveModalOpen(false);
                setSelectedRequest(null);
                
                // Mostrar toast de éxito
                const message = page.props.flash?.success || 'Solicitud aprobada exitosamente.';
                addToast({
                    type: 'success',
                    title: 'Aprobación exitosa',
                    message: message,
                    duration: 5000
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || 'Error al aprobar la solicitud.';
                addToast({
                    type: 'error',
                    title: 'Error al aprobar',
                    message: errorMessage,
                    duration: 5000
                });
            }
        });
    };

    const confirmReject = () => {
        if (!selectedRequest) return;

        router.post(route('dcs.pdv-change-requests.reject', selectedRequest.id), {
            rejection_reason: rejectionReason || null
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                setIsRejectModalOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
                
                // Mostrar toast de éxito
                const message = page.props.flash?.success || 'Solicitud rechazada exitosamente.';
                addToast({
                    type: 'success',
                    title: 'Rechazo exitoso',
                    message: message,
                    duration: 5000
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || 'Error al rechazar la solicitud.';
                addToast({
                    type: 'error',
                    title: 'Error al rechazar',
                    message: errorMessage,
                    duration: 5000
                });
            }
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('dcs.pdv-change-requests.index'), {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            zonal: zonalFilter !== 'all' ? zonalFilter : undefined,
            page,
            per_page: changeRequests.per_page
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('dcs.pdv-change-requests.index'), {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            zonal: zonalFilter !== 'all' ? zonalFilter : undefined,
            page: 1,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    variant: 'secondary' as const,
                    icon: Clock,
                    text: 'Pendiente',
                    className: 'text-amber-700 bg-amber-50 border-amber-200'
                };
            case 'approved':
                return {
                    variant: 'secondary' as const,
                    icon: CheckCircle2,
                    text: 'Aprobada',
                    className: 'text-green-700 bg-green-50 border-green-200'
                };
            case 'rejected':
                return {
                    variant: 'secondary' as const,
                    icon: XCircle,
                    text: 'Rechazada',
                    className: 'text-red-700 bg-red-50 border-red-200'
                };
            default:
                return {
                    variant: 'secondary' as const,
                    icon: AlertCircle,
                    text: 'Desconocido',
                    className: 'text-gray-700 bg-gray-50 border-gray-200'
                };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Card className="bg-white border border-gray-200 shadow-sm">
                {/* Header de la tabla */}
                <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Solicitudes de Cambio</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {changeRequests.total} total
                            </Badge>
                        </div>

                        {/* Filtros */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Filtro por estado */}
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="pending">Pendientes</SelectItem>
                                        <SelectItem value="approved">Aprobadas</SelectItem>
                                        <SelectItem value="rejected">Rechazadas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro por zonal */}
                            {availableZonals.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    <Select value={zonalFilter} onValueChange={handleZonalFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Todos los zonales" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los zonales</SelectItem>
                                            {availableZonals.map((zonal) => (
                                                <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                                    {zonal.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Buscador */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por PDV, vendedor o zonal..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Botón para limpiar filtros */}
                            {(statusFilter !== 'all' || zonalFilter !== 'all' || searchTerm) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-xs hover:bg-gray-50 cursor-pointer flex-shrink-0"
                                >
                                    <Filter className="w-3 h-3 mr-1" />
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vista Desktop - Tabla */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PDV / Vendedor
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zonal
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cambios Solicitados
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {changeRequests.data.map((request) => {
                                const statusConfig = getStatusConfig(request.status);
                                const hasChanges = Object.keys(request.changes).length > 0;

                                return (
                                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                        {/* PDV / Vendedor */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {request.pdv.point_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <User className="w-3 h-3" />
                                                    <span>{request.user.first_name} {request.user.last_name}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Zonal / Circuito / Ruta */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {request.zonal.name}
                                                </Badge>
                                                {request.pdv.route?.circuit && (
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-medium">Circuito:</span> {request.pdv.route.circuit.name}
                                                    </div>
                                                )}
                                                {request.pdv.route && (
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-medium">Ruta:</span> {request.pdv.route.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Cambios */}
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                {request.changes.address && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Dirección:</span>
                                                        <span className="text-gray-600 truncate max-w-xs">
                                                            {request.changes.address}
                                                        </span>
                                                    </div>
                                                )}
                                                {request.changes.reference && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Referencia:</span>
                                                        <span className="text-gray-600 truncate max-w-xs">
                                                            {request.changes.reference}
                                                        </span>
                                                    </div>
                                                )}
                                                {(request.changes.latitude || request.changes.longitude) && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Coordenadas:</span>
                                                        <span className="text-gray-600">
                                                            {request.changes.latitude?.toFixed(6)}, {request.changes.longitude?.toFixed(6)}
                                                        </span>
                                                    </div>
                                                )}
                                                {!hasChanges && (
                                                    <span className="text-gray-400 italic">Sin cambios</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={statusConfig.className}>
                                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                                {statusConfig.text}
                                            </Badge>
                                        </td>

                                        {/* Fecha */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                {formatDate(request.created_at)}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {request.status === 'pending' && (
                                                    <>
                                                        {hasPermission('gestor-pdv-aprobaciones-aprobar') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleApprove(request)}
                                                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer"
                                                                title="Aprobar solicitud"
                                                            >
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                        {hasPermission('gestor-pdv-aprobaciones-rechazar') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleReject(request)}
                                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                                                title="Rechazar solicitud"
                                                            >
                                                                <XIcon className="w-4 h-4 text-red-600" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {request.status !== 'pending' && (
                                                    <span className="text-xs text-gray-400">
                                                        {request.status === 'approved' && request.approved_at
                                                            ? `Aprobada: ${formatDateTime(request.approved_at)}`
                                                            : request.status === 'rejected' && request.rejected_at
                                                            ? `Rechazada: ${formatDateTime(request.rejected_at)}`
                                                            : 'Procesada'}
                                                    </span>
                                                )}
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
                    {changeRequests.data.map((request) => {
                        const statusConfig = getStatusConfig(request.status);
                        const hasChanges = Object.keys(request.changes).length > 0;

                        return (
                            <div key={request.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {request.pdv.point_name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {request.user.first_name} {request.user.last_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Zonal / Circuito / Ruta */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <Badge variant="secondary" className="text-xs">
                                                {request.zonal.name}
                                            </Badge>
                                        </div>
                                        {request.pdv.route?.circuit && (
                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">Circuito:</span> {request.pdv.route.circuit.name}
                                            </div>
                                        )}
                                        {request.pdv.route && (
                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">Ruta:</span> {request.pdv.route.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cambios */}
                                    {hasChanges && (
                                        <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                                            {request.changes.address && (
                                                <div>
                                                    <span className="font-medium">Dirección:</span>
                                                    <span className="text-gray-600 ml-1">{request.changes.address}</span>
                                                </div>
                                            )}
                                            {request.changes.reference && (
                                                <div>
                                                    <span className="font-medium">Referencia:</span>
                                                    <span className="text-gray-600 ml-1">{request.changes.reference}</span>
                                                </div>
                                            )}
                                            {(request.changes.latitude || request.changes.longitude) && (
                                                <div>
                                                    <span className="font-medium">Coordenadas:</span>
                                                    <span className="text-gray-600 ml-1">
                                                        {request.changes.latitude?.toFixed(6)}, {request.changes.longitude?.toFixed(6)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Fecha */}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(request.created_at)}
                                    </div>

                                    {/* Acciones */}
                                    {request.status === 'pending' && (
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                            {hasPermission('gestor-pdv-aprobaciones-aprobar') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleApprove(request)}
                                                    className="h-8 px-3 text-xs hover:bg-green-50 hover:border-green-200 cursor-pointer"
                                                >
                                                    <Check className="w-3 h-3 mr-1 text-green-600" />
                                                    Aprobar
                                                </Button>
                                            )}
                                            {hasPermission('gestor-pdv-aprobaciones-rechazar') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleReject(request)}
                                                    className="h-8 px-3 text-xs hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                                >
                                                    <XIcon className="w-3 h-3 mr-1 text-red-600" />
                                                    Rechazar
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Estado vacío */}
                {changeRequests.data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileCheck className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    No hay solicitudes
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    No se encontraron solicitudes de cambio con los filtros aplicados
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paginación */}
                {changeRequests.last_page > 1 && (
                    <Pagination
                        data={changeRequests}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de aprobación */}
            <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Aprobación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas aprobar esta solicitud? Los cambios se aplicarán al PDV.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">PDV:</Label>
                                <p className="text-sm text-gray-600">{selectedRequest.pdv.point_name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Vendedor:</Label>
                                <p className="text-sm text-gray-600">
                                    {selectedRequest.user.first_name} {selectedRequest.user.last_name}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Cambios:</Label>
                                <div className="text-xs space-y-1 mt-1 bg-gray-50 p-2 rounded">
                                    {selectedRequest.changes.address && (
                                        <div>
                                            <span className="font-medium">Dirección:</span>
                                            <span className="ml-1">{selectedRequest.changes.address}</span>
                                        </div>
                                    )}
                                    {selectedRequest.changes.reference && (
                                        <div>
                                            <span className="font-medium">Referencia:</span>
                                            <span className="ml-1">{selectedRequest.changes.reference}</span>
                                        </div>
                                    )}
                                    {(selectedRequest.changes.latitude || selectedRequest.changes.longitude) && (
                                        <div>
                                            <span className="font-medium">Coordenadas:</span>
                                            <span className="ml-1">
                                                {selectedRequest.changes.latitude?.toFixed(6)}, {selectedRequest.changes.longitude?.toFixed(6)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmApprove} className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-2" />
                            Aprobar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de rechazo */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Rechazo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas rechazar esta solicitud? Puedes agregar un motivo opcional.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">PDV:</Label>
                                <p className="text-sm text-gray-600">{selectedRequest.pdv.point_name}</p>
                            </div>
                            <div>
                                <Label htmlFor="rejection_reason" className="text-sm font-medium">
                                    Motivo del rechazo (opcional):
                                </Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ingresa el motivo del rechazo..."
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
                            <XIcon className="w-4 h-4 mr-2" />
                            Rechazar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
