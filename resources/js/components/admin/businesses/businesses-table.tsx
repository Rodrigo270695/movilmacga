import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import {
    Building2,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Calendar,
    MapPin,
    Network,
    FileText
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Business {
    id: number;
    name: string;
    status?: boolean | number;
    zonales_count?: number;
    active_zonales_count?: number;
    created_at: string;
}

interface PaginatedBusinesses {
    data: Business[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface BusinessesTableProps {
    businesses: PaginatedBusinesses;
    onEdit: (business: Business) => void;
    onAssociateZonales: (business: Business) => void;
    userPermissions: string[];
}

export function BusinessesTable({ businesses, onEdit, onAssociateZonales, userPermissions }: BusinessesTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmToggleBusiness, setConfirmToggleBusiness] = useState<Business | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Función para navegar a formularios del negocio
    const navigateToBusinessForms = (business: Business) => {
        if (!hasPermission('gestor-formularios-ver')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para ver formularios dinámicos.',
                duration: 4000
            });
            return;
        }
        router.visit(route('admin.business-forms.index', { business_id: business.id }));
    };

    // Filtrar businesses por término de búsqueda
    const filteredBusinesses = useMemo(() => {
        if (!searchTerm.trim()) {
            return businesses.data;
        }

        return businesses.data.filter(business =>
            business.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses.data, searchTerm]);

    const handleToggleStatus = (business: Business) => {
        if (!hasPermission('gestor-business-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de negocios.',
                duration: 4000
            });
            return;
        }
        setConfirmToggleBusiness(business);
    };




    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Componente para las acciones de cada negocio
    const BusinessActions = ({ business }: { business: Business }) => {
        const actions = [];

        if (hasPermission('gestor-business-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(business)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                    title="Editar negocio"
                >
                    <Edit className="w-4 h-4 text-blue-600" />
                </Button>
            );
        }

        if (hasPermission('gestor-business-editar')) {
            actions.push(
                <Button
                    key="associate"
                    variant="outline"
                    size="sm"
                    onClick={() => onAssociateZonales(business)}
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer"
                    title="Gestionar zonales"
                >
                    <Network className="w-4 h-4 text-green-600" />
                </Button>
            );
        }

        if (hasPermission('gestor-formularios-ver')) {
            actions.push(
                <Button
                    key="forms"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToBusinessForms(business)}
                    className="h-8 w-8 p-0 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer"
                    title="Gestionar formularios"
                >
                    <FileText className="w-4 h-4 text-indigo-600" />
                </Button>
            );
        }

        if (hasPermission('gestor-business-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(business)}
                    className={`h-8 w-8 p-0 cursor-pointer ${
                        business.status
                            ? "hover:bg-red-50 hover:border-red-200"
                            : "hover:bg-green-50 hover:border-green-200"
                    }`}
                    title={business.status ? "Desactivar negocio" : "Activar negocio"}
                >
                    <Power className={`w-4 h-4 ${
                        business.status ? "text-red-600" : "text-green-600"
                    }`} />
                </Button>
            );
        }

        return actions;
    };

    const getStatusBadge = (status?: boolean | number) => {
        const isActive = Boolean(status);
        return (
            <Badge
                variant={isActive ? "default" : "secondary"}
                className={`
                    ${isActive
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }
                    font-medium transition-colors
                `}
            >
                {isActive ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</>
                ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                )}
            </Badge>
        );
    };

    const getStatusConfig = (status?: boolean | number) => {
        const isActive = Boolean(status);

        if (isActive) {
            return {
                text: 'Activo',
                icon: CheckCircle2,
                className: 'bg-green-100 text-green-800 border-green-200'
            };
        } else {
            return {
                text: 'Inactivo',
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
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Negocios del Sistema</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {searchTerm
                                    ? `${filteredBusinesses.length} de ${businesses.data.length}`
                                    : `${businesses.total} total`
                                }
                            </Badge>
                        </div>

                        {/* Buscador - Responsive */}
                        <div className="flex items-center gap-4">
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
                                    Negocio
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zonales
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registro
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBusinesses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500">
                                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">
                                            {searchTerm ? 'No se encontraron negocios' : 'No hay negocios registrados'}
                                        </p>
                                        <p className="text-sm">
                                            {searchTerm
                                                ? 'Intenta con un término de búsqueda diferente'
                                                : 'Crea tu primer negocio para comenzar'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBusinesses.map((business) => (
                                    <tr key={business.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Negocio */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {business.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {business.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Zonales */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {business.zonales_count || 0}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {business.zonales_count === 1 ? 'zonal' : 'zonales'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(business.status)}
                                        </td>

                                        {/* Registro */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(business.created_at)}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <BusinessActions business={business} />
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
                    {filteredBusinesses.map((business) => {
                        const statusConfig = getStatusConfig(business.status);
                        const actions = BusinessActions({ business });

                        return (
                            <div key={business.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="p-4 space-y-3">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {business.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    ID: {business.id}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Información del negocio */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-sm text-gray-900">
                                            <Network className="w-3 h-3 text-gray-400" />
                                            <span>{business.zonales_count || 0} {(business.zonales_count === 1) ? 'zonal' : 'zonales'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            <span>Creado: {formatDate(business.created_at)}</span>
                                        </div>
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
                {businesses.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                        <Pagination
                            current={businesses.current_page}
                            total={businesses.last_page}
                            onPageChange={(page) => {
                                router.get(route('admin.businesses.index'), { page }, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                        />

                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Mostrando {businesses.from} - {businesses.to} de {businesses.total} negocios
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal de confirmación */}
            <ConfirmToggleModal
                isOpen={!!confirmToggleBusiness}
                onClose={() => setConfirmToggleBusiness(null)}
                business={confirmToggleBusiness}
            />
        </>
    );
}
