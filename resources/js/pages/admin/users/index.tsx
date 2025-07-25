import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UserForm } from '@/components/admin/users/user-form';
import { UsersTable } from '@/components/admin/users/users-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

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

interface Props {
    users: PaginatedUsers;
    roles: Role[];
    flash?: {
        success?: string;
        error?: string;
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
        title: 'Gestión de Usuarios',
        href: '/admin/users',
    },
];

export default function UsersIndex({ users, roles, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Mostrar toasts para mensajes flash
    useEffect(() => {
        if (flash?.success) {
            addToast({
                type: 'success',
                title: '¡Éxito!',
                message: flash.success,
                duration: 4000
            });
        }
        
        if (flash?.error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: flash.error,
                duration: 5000
            });
        }
    }, [flash, addToast]);

    const openCreateUserDialog = () => {
        if (!hasPermission('gestor-usuarios-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear usuarios.',
                duration: 4000
            });
            return;
        }
        setEditingUser(null);
        setIsUserFormOpen(true);
    };

    const openEditUserDialog = (user: User) => {
        if (!hasPermission('gestor-usuarios-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar usuarios.',
                duration: 4000
            });
            return;
        }
        setEditingUser(user);
        setIsUserFormOpen(true);
    };

    const closeUserForm = () => {
        setIsUserFormOpen(false);
        setEditingUser(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Usuarios" />
            
            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Gestión de Usuarios
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Administra los usuarios y roles del sistema
                                    </p>
                                    
                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{users.total} usuarios</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{roles.length} roles disponibles</span>
                                        </div>
                                        {users.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {users.current_page}/{users.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-usuarios-crear') && (
                                    <div className="hidden sm:block">
                                        <Button 
                                            onClick={openCreateUserDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Usuario
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de usuarios - Responsive */}
                    <UsersTable
                        users={users}
                        onEdit={openEditUserDialog}
                        userPermissions={userPermissions}
                    />

                    {/* Modales */}
                    <UserForm
                        isOpen={isUserFormOpen}
                        onClose={closeUserForm}
                        user={editingUser}
                        roles={roles}
                    />
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-usuarios-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateUserDialog}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 