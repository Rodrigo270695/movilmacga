import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import { 
    Users, 
    Edit, 
    Power, 
    Settings, 
    Shield,
    CheckCircle2,
    XCircle,
    Search,
    X
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    users_count?: number;
    status?: boolean | number;
}

interface PaginatedRoles {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface RolesTableProps {
    roles: PaginatedRoles;
    onEdit: (role: Role) => void;
    onAssignPermissions: (role: Role) => void;
    userPermissions: string[];
}

export function RolesTable({ roles, onEdit, onAssignPermissions, userPermissions }: RolesTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmToggleRole, setConfirmToggleRole] = useState<Role | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Filtrar roles basado en el término de búsqueda (solo en la página actual)
    const filteredRoles = useMemo(() => {
        if (!searchTerm) return roles.data;
        
        const search = searchTerm.toLowerCase();
        return roles.data.filter(role => {
            // Buscar por nombre del rol
            const matchesName = role.name.toLowerCase().includes(search);
            
            // Buscar por estado
            const status = (role.status === false || role.status === 0 || role.status === null) ? 'inactivo' : 'activo';
            const matchesStatus = status.includes(search);
            
            // Buscar por nombres de permisos
            const matchesPermissions = role.permissions.some(permission => 
                permission.name.toLowerCase().includes(search)
            );
            
            return matchesName || matchesStatus || matchesPermissions;
        });
    }, [roles.data, searchTerm]);

    const handleToggleStatus = (role: Role) => {
        if (!hasPermission('gestor-roles-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de roles.',
                duration: 4000
            });
            return;
        }
        setConfirmToggleRole(role);
    };

    const closeConfirmToggle = () => {
        setConfirmToggleRole(null);
    };

    const handlePageChange = (page: number) => {
        router.get(route('admin.roles.index'), { 
            page,
            per_page: roles.per_page
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
        router.get(route('admin.roles.index'), { 
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

    // Componente para las acciones de cada rol
    const RoleActions = ({ role }: { role: Role }) => {
        const actions = [];

        if (hasPermission('gestor-roles-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(role)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer sm:h-8 sm:w-8"
                    title="Editar rol"
                >
                    <Edit className="w-4 h-4" />
                </Button>
            );
        }

        if (hasPermission('gestor-roles-asignar-permisos')) {
            actions.push(
                <Button
                    key="permissions"
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignPermissions(role)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50 cursor-pointer sm:h-8 sm:w-8"
                    title="Gestionar permisos"
                >
                    <Settings className="w-4 h-4" />
                </Button>
            );
        }

        if (hasPermission('gestor-roles-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(role)}
                    className={`h-8 w-8 p-0 cursor-pointer sm:h-8 sm:w-8 ${
                        (role.status === false || role.status === 0 || role.status === null) 
                            ? "text-gray-500 hover:text-green-600 hover:bg-green-50" 
                            : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                    title={(role.status === false || role.status === 0 || role.status === null) ? "Activar rol" : "Desactivar rol"}
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
                            <Shield className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Roles del Sistema</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {searchTerm 
                                    ? `${filteredRoles.length} de ${roles.data.length}`
                                    : `${roles.total} total`
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
                                    Rol
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permisos
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuarios
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRoles.map((role) => {
                                const statusConfig = getStatusConfig(role.status);
                                
                                return (
                                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Nombre del rol */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {role.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Permisos */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {role.permissions.slice(0, 2).map((permission) => (
                                                    <Badge 
                                                        key={permission.id} 
                                                        variant="outline" 
                                                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                    >
                                                        {permission.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 2 && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                                                    >
                                                        +{role.permissions.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {role.permissions.length} {role.permissions.length === 1 ? 'permiso' : 'permisos'}
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Badge className={statusConfig.className}>
                                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                                {statusConfig.text}
                                            </Badge>
                                        </td>

                                        {/* Usuarios */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1 text-gray-600">
                                                <span className="text-sm font-medium">
                                                    {role.users_count || 0}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <RoleActions role={role} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Vista Mobile - Tarjetas */}
                <div className="sm:hidden">
                    {filteredRoles.map((role) => {
                        const statusConfig = getStatusConfig(role.status);
                        const actions = RoleActions({ role });
                        
                        return (
                            <div key={role.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="p-4 space-y-3">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {role.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {role.users_count || 0} usuarios
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Permisos */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {role.permissions.length} {role.permissions.length === 1 ? 'permiso' : 'permisos'}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 3).map((permission) => (
                                                <Badge 
                                                    key={permission.id} 
                                                    variant="outline" 
                                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                    {permission.name}
                                                </Badge>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                                                >
                                                    +{role.permissions.length - 3}
                                                </Badge>
                                            )}
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

                {/* Estado vacío */}
                {filteredRoles.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    {searchTerm ? 'No se encontraron resultados' : 'No hay roles en esta página'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm 
                                        ? 'Intenta con otros términos de búsqueda'
                                        : 'Navega a otras páginas o crea un nuevo rol'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paginación */}
                {roles.last_page > 1 && (
                    <Pagination
                        data={roles}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de confirmación */}
            <ConfirmToggleModal
                isOpen={!!confirmToggleRole}
                onClose={closeConfirmToggle}
                role={confirmToggleRole}
            />
        </>
    );
}
 