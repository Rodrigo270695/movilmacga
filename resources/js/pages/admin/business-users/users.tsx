import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, ArrowLeft, Users, Building2, UserX } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { ConfirmUnassignModal } from '@/components/admin/business-users/confirm-unassign-modal';

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

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    business: Business;
    users: PaginatedUsers;
    filters: {
        search?: string;
        per_page?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Admin',
        href: '#',
    },
    {
        title: 'Usuario-Negocio',
        href: '/admin/business-users',
    },
    {
        title: 'Usuarios del Negocio',
        href: '#',
    },
];

export default function BusinessUsersPage({ business, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);

        router.get(`/admin/business-users/${business.id}/users`, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        router.get(`/admin/business-users/${business.id}/users`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('page', page.toString());

        router.get(`/admin/business-users/${business.id}/users`, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('per_page', perPage.toString());

        router.get(`/admin/business-users/${business.id}/users`, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleUnassignUser = (user: User) => {
        setSelectedUser(user);
        setUnassignModalOpen(true);
    };

    const closeUnassignModal = () => {
        setUnassignModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Usuarios de ${business.name}`} />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get('/admin/business-users')}
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Volver
                                        </Button>
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                            Usuarios de {business.name}
                                        </h1>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Gestiona todos los usuarios asignados a este negocio
                                    </p>
                                </div>
                                <Badge
                                    variant={business.status ? "default" : "secondary"}
                                    className={business.status ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                                >
                                    {business.status ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>

                            {/* Estadísticas */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>{users.total} usuarios total</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{users.data.filter(u => u.status).length} activos</span>
                                </div>
                                {users.last_page > 1 && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        <span>Página {users.current_page} de {users.last_page}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Buscar usuarios..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
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
                    </div>

                    {/* Lista de usuarios */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Lista de Usuarios
                            </h2>

                            <div className="space-y-3">
                                {users.data.map((user) => (
                                    <div key={user.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-gray-600">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={user.status ? "default" : "secondary"}
                                                className={user.status ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                                            >
                                                {user.status ? "Activo" : "Inactivo"}
                                            </Badge>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleUnassignUser(user)}
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
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {users.data.length === 0 && (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-600">No se encontraron usuarios</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Paginación */}
                    {users.last_page > 1 && (
                        <Pagination
                            data={{
                                current_page: users.current_page,
                                last_page: users.last_page,
                                per_page: users.per_page,
                                total: users.total,
                                from: users.from,
                                to: users.to
                            }}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}
                </div>
            </div>

            {/* Modal de confirmación para desasignar */}
            <ConfirmUnassignModal
                open={unassignModalOpen}
                onClose={closeUnassignModal}
                user={selectedUser}
                business={business}
            />
        </AppLayout>
    );
}
