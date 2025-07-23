import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import {
    Folder,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Calendar,
    MapPin
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Zonal {
    id: number;
    name: string;
    status?: boolean | number;
    created_at: string;
}

interface PaginatedZonales {
    data: Zonal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface ZonalesTableProps {
    zonales: PaginatedZonales;
    onEdit: (zonal: Zonal) => void;
    userPermissions: string[];
}

export function ZonalesTable({ zonales, onEdit, userPermissions }: ZonalesTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmToggleZonal, setConfirmToggleZonal] = useState<Zonal | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Filtrar zonales basado en el término de búsqueda (solo en la página actual)
    const filteredZonales = useMemo(() => {
        if (!searchTerm) return zonales.data;

        const search = searchTerm.toLowerCase();
        return zonales.data.filter(zonal => {
            // Buscar por nombre
            const matchesName = zonal.name.toLowerCase().includes(search);

            // Buscar por estado
            const status = (zonal.status === false || zonal.status === 0 || zonal.status === null) ? 'inactivo' : 'activo';
            const matchesStatus = status.includes(search);

            return matchesName || matchesStatus;
        });
    }, [zonales.data, searchTerm]);

    const handleToggleStatus = (zonal: Zonal) => {
        if (!hasPermission('gestor-zonal-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de zonales.',
                duration: 4000
            });
            return;
        }
        setConfirmToggleZonal(zonal);
    };

    const closeConfirmToggle = () => {
        setConfirmToggleZonal(null);
    };

    const handlePageChange = (page: number) => {
        router.get(route('dcs.zonales.index'), {
            page,
            per_page: zonales.per_page
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
        router.get(route('dcs.zonales.index'), {
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

    // Componente para las acciones de cada zonal
    const ZonalActions = ({ zonal }: { zonal: Zonal }) => {
        const actions = [];

        if (hasPermission('gestor-zonal-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(zonal)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer sm:h-8 sm:w-8"
                    title="Editar zonal"
                >
                    <Edit className="w-4 h-4" />
                </Button>
            );
        }

        if (hasPermission('gestor-zonal-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(zonal)}
                    className={`h-8 w-8 p-0 cursor-pointer sm:h-8 sm:w-8 ${
                        (zonal.status === false || zonal.status === 0 || zonal.status === null)
                            ? "text-gray-500 hover:text-green-600 hover:bg-green-50"
                            : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                    title={(zonal.status === false || zonal.status === 0 || zonal.status === null) ? "Activar zonal" : "Desactivar zonal"}
                >
                    <Power className="w-4 h-4" />
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
                            <Folder className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Zonales del Sistema</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {searchTerm
                                    ? `${filteredZonales.length} de ${zonales.data.length}`
                                    : `${zonales.total} total`
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
                                    Zonal
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
                            {filteredZonales.map((zonal) => {
                                const statusConfig = getStatusConfig(zonal.status);
                                const actions = ZonalActions({ zonal });

                                return (
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
                                                        ID: {zonal.id}
                                                    </div>
                                                </div>
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
                                                {formatDate(zonal.created_at)}
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
                <div className="sm:hidden divide-y divide-gray-200">
                    {filteredZonales.map((zonal) => {
                        const statusConfig = getStatusConfig(zonal.status);
                        const actions = ZonalActions({ zonal });

                        return (
                            <div key={zonal.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header del card */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {zonal.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    ID: {zonal.id}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Fecha de registro */}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        Creado: {formatDate(zonal.created_at)}
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
                {filteredZonales.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Folder className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    {searchTerm ? 'No se encontraron resultados' : 'No hay zonales en esta página'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm
                                        ? 'Intenta con otros términos de búsqueda'
                                        : 'Navega a otras páginas o crea un nuevo zonal'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paginación */}
                {zonales.last_page > 1 && (
                    <Pagination
                        data={zonales}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de confirmación */}
            <ConfirmToggleModal
                isOpen={!!confirmToggleZonal}
                onClose={closeConfirmToggle}
                zonal={confirmToggleZonal}
            />
        </>
    );
}
