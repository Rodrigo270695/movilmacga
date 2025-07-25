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
    X,
    Mail,
    Phone,
    IdCard,
    Calendar
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    dni: string;
    phone_number?: string;
    status?: boolean | number;
    roles: Role[];
    created_at: string;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface UsersTableProps {
    users: PaginatedUsers;
    onEdit: (user: User) => void;
    userPermissions: string[];
}

export function UsersTable({ users, onEdit, userPermissions }: UsersTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Filtrar usuarios basado en el término de búsqueda (solo en la página actual)
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users.data;

        const search = searchTerm.toLowerCase();
        return users.data.filter(user => {
            // Buscar por nombre completo
            const matchesName = user.name.toLowerCase().includes(search);

            // Buscar por username
            const matchesUsername = user.username.toLowerCase().includes(search);

            // Buscar por email
            const matchesEmail = user.email.toLowerCase().includes(search);

            // Buscar por DNI
            const matchesDni = user.dni.includes(search);

            // Buscar por estado
            const status = (user.status === false || user.status === 0 || user.status === null) ? 'inactivo' : 'activo';
            const matchesStatus = status.includes(search);

            // Buscar por roles
            const matchesRoles = user.roles.some(role =>
                role.name.toLowerCase().includes(search)
            );

            return matchesName || matchesUsername || matchesEmail || matchesDni || matchesStatus || matchesRoles;
        });
    }, [users.data, searchTerm]);

    const handleToggleStatus = (user: User) => {
        if (!hasPermission('gestor-usuarios-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de usuarios.',
                duration: 4000
            });
            return;
        }
        setConfirmToggleUser(user);
    };

    const closeConfirmToggle = () => {
        setConfirmToggleUser(null);
    };

    const handlePageChange = (page: number) => {
        router.get(route('admin.users.index'), {
            page,
            per_page: users.per_page
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
        router.get(route('admin.users.index'), {
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

    // Componente para las acciones de cada usuario
    const UserActions = ({ user }: { user: User }) => {
        const actions = [];

        if (hasPermission('gestor-usuarios-editar')) {
            actions.push(
                <Button
                    key="edit"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                    title="Editar usuario"
                >
                    <Edit className="w-4 h-4 text-blue-600" />
                </Button>
            );
        }



                if (hasPermission('gestor-usuarios-cambiar-estado')) {
            actions.push(
                <Button
                    key="toggle"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user)}
                    className={`h-8 w-8 p-0 cursor-pointer ${
                        (user.status === false || user.status === 0 || user.status === null)
                            ? "hover:bg-green-50 hover:border-green-200"
                            : "hover:bg-red-50 hover:border-red-200"
                    }`}
                    title={(user.status === false || user.status === 0 || user.status === null) ? "Activar usuario" : "Desactivar usuario"}
                >
                    <Power className={`w-4 h-4 ${
                        (user.status === false || user.status === 0 || user.status === null)
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
                            <Users className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Usuarios del Sistema</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {searchTerm
                                    ? `${filteredUsers.length} de ${users.data.length}`
                                    : `${users.total} total`
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
                                    Usuario
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Roles
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
                            {filteredUsers.map((user) => {
                                const statusConfig = getStatusConfig(user.status);

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Usuario */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        @{user.username} • DNI: {user.dni}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {user.email}
                                                </div>
                                                {user.phone_number && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {user.phone_number}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Roles */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {user.roles.slice(0, 2).map((role) => (
                                                    <Badge
                                                        key={role.id}
                                                        variant="outline"
                                                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                                    >
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                                {user.roles.length > 2 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                                                    >
                                                        +{user.roles.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {user.roles.length} {user.roles.length === 1 ? 'rol' : 'roles'}
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Badge className={statusConfig.className}>
                                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                                {statusConfig.text}
                                            </Badge>
                                        </td>

                                        {/* Registro */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <UserActions user={user} />
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
                    {filteredUsers.map((user) => {
                        const statusConfig = getStatusConfig(user.status);
                        const actions = UserActions({ user });

                        return (
                            <div key={user.id} className="border-b border-gray-200 last:border-b-0">
                                <div className="p-4 space-y-3">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {user.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    @{user.username} • DNI: {user.dni}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}>
                                            <statusConfig.icon className="w-3 h-3 mr-1" />
                                            {statusConfig.text}
                                        </Badge>
                                    </div>

                                    {/* Contacto */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-sm text-gray-900">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        {user.phone_number && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                {user.phone_number}
                                            </div>
                                        )}
                                    </div>

                                    {/* Roles */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {user.roles.length} {user.roles.length === 1 ? 'rol' : 'roles'}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.slice(0, 3).map((role) => (
                                                <Badge
                                                    key={role.id}
                                                    variant="outline"
                                                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                                >
                                                    {role.name}
                                                </Badge>
                                            ))}
                                            {user.roles.length > 3 && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                                                >
                                                    +{user.roles.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fecha de registro */}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        Registrado: {formatDate(user.created_at)}
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
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios en esta página'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm
                                        ? 'Intenta con otros términos de búsqueda'
                                        : 'Navega a otras páginas o crea un nuevo usuario'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paginación */}
                {users.last_page > 1 && (
                    <Pagination
                        data={users}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </Card>

            {/* Modal de confirmación */}
            <ConfirmToggleModal
                isOpen={!!confirmToggleUser}
                onClose={closeConfirmToggle}
                user={confirmToggleUser}
            />
        </>
    );
}
