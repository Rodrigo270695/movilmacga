import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, UserPlus, Users, Building2, UserX } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmUnassignModal } from './confirm-unassign-modal';


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
    active_users?: User[];
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

interface Props {
    businesses: PaginatedBusinesses;
    allBusinesses: Business[];
    filters: {
        search?: string;
        business?: string;
        status?: string;
        per_page?: number;
    };
    onAssign: (business: Business) => void;
    onReassign: (business: Business) => void;
    onError: (message: string) => void;
    userPermissions: string[];
}

export function BusinessUsersTable({
    businesses,
    allBusinesses,
    filters,
    onAssign,
    onReassign,
    onError,
    userPermissions
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBusiness, setSelectedBusiness] = useState(filters.business || 'todos');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'todos');
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedBusinessForUnassign, setSelectedBusinessForUnassign] = useState<Business | null>(null);


    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedBusiness && selectedBusiness !== 'todos') params.set('business', selectedBusiness);
        if (selectedStatus && selectedStatus !== 'todos') params.set('status', selectedStatus);

        router.get('/admin/business-users', Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedBusiness('todos');
        setSelectedStatus('todos');
        router.get('/admin/business-users', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleUnassignUser = (business: Business, user: User) => {
        setSelectedUser(user);
        setSelectedBusinessForUnassign(business);
        setUnassignModalOpen(true);
    };

    const closeUnassignModal = () => {
        setUnassignModalOpen(false);
        setSelectedUser(null);
        setSelectedBusinessForUnassign(null);
    };



    return (
        <>
            <div className="space-y-4">
                                {/* Filtros */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                Filtros de Búsqueda
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</label>
                                    <Input
                                        placeholder="Buscar por nombre..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Negocio</label>
                                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                            <SelectValue placeholder="Todos los negocios" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos los negocios</SelectItem>
                                            {allBusinesses.map((business) => (
                                                <SelectItem key={business.id} value={business.name}>
                                                    {business.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                            <SelectValue placeholder="Todos los estados" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos los estados</SelectItem>
                                            <SelectItem value="assigned">Con usuarios asignados</SelectItem>
                                            <SelectItem value="unassigned">Sin usuarios asignados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button
                                        onClick={handleSearch}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        Buscar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

            {/* Tabla */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Negocios y Usuarios Asignados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {businesses.data.map((business) => (
                            <div key={business.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {business.active_users?.length || 0} usuarios asignados
                                            </p>
                                        </div>
                                        <Badge
                                            variant={business.status ? "default" : "secondary"}
                                            className={business.status ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                                        >
                                            {business.status ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasPermission('gestor-business-user-asignar') && (
                                            <Button
                                                size="sm"
                                                onClick={() => onAssign(business)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Asignar Usuario
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {business.active_users && business.active_users.length > 0 ? (
                                        <div>
                                            {/* Mostrar solo los primeros 3 usuarios */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                                                {business.active_users.slice(0, 3).map((user) => (
                                                    <div key={user.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {user.first_name} {user.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-600">{user.email}</p>
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                💼 Puede tener múltiples negocios
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={user.status ? "default" : "secondary"}
                                                                className={user.status ? "bg-green-100 text-green-800 border-green-200 text-xs" : "bg-gray-100 text-gray-800 border-gray-200 text-xs"}
                                                            >
                                                                {user.status ? "Activo" : "Inactivo"}
                                                            </Badge>
                                                            {hasPermission('gestor-business-user-desasignar') && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleUnassignUser(business, user)}
                                                                                className="text-red-600 border-red-300 hover:bg-red-50 cursor-pointer"
                                                                            >
                                                                                <UserX className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Desasignar usuario</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Mostrar contador y botón para ver más */}
                                            {business.active_users.length > 3 && (
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-700">
                                                            +{business.active_users.length - 3} usuarios más
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.get(`/admin/business-users/${business.id}/users`)}
                                                        className="text-blue-600 border-blue-300 hover:bg-blue-100 bg-white cursor-pointer"
                                                    >
                                                        Ver todos ({business.active_users.length})
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p className="text-sm text-gray-600 font-medium">No hay usuarios asignados</p>
                                            <p className="text-xs text-gray-500 mt-1">Asigna usuarios para comenzar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación */}
                    {businesses.last_page > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={businesses.current_page}
                                lastPage={businesses.last_page}
                                total={businesses.total}
                                perPage={businesses.per_page}
                                from={businesses.from}
                                to={businesses.to}
                                baseUrl="/admin/business-users"
                                queryParams={filters}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>


            </div>

            {/* Modal de confirmación para desasignar */}
            <ConfirmUnassignModal
                open={unassignModalOpen}
                onClose={closeUnassignModal}
                user={selectedUser}
                business={selectedBusinessForUnassign}
            />
        </>
    );
}
