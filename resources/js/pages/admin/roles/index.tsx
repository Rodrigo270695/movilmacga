import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { RoleForm } from '@/components/admin/roles/role-form';
import { PermissionManager } from '@/components/admin/roles/permission-manager';
import { RolesTable } from '@/components/admin/roles/roles-table';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

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

interface Props {
    roles: PaginatedRoles;
    permissions: Permission[];
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
        title: 'Gestión de Roles',
        href: '/admin/roles',
    },
];

export default function RolesIndex({ roles, permissions, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    
    const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
    const [isPermissionManagerOpen, setIsPermissionManagerOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [managingPermissionsRole, setManagingPermissionsRole] = useState<Role | null>(null);

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

    const openCreateRoleDialog = () => {
        if (!hasPermission('gestor-roles-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear roles.',
                duration: 4000
            });
            return;
        }
        setEditingRole(null);
        setIsRoleFormOpen(true);
    };

    const openEditRoleDialog = (role: Role) => {
        if (!hasPermission('gestor-roles-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar roles.',
                duration: 4000
            });
            return;
        }
        setEditingRole(role);
        setIsRoleFormOpen(true);
    };

    const openPermissionManager = (role: Role) => {
        if (!hasPermission('gestor-roles-asignar-permisos')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para asignar permisos a roles.',
                duration: 4000
            });
            return;
        }
        setManagingPermissionsRole(role);
        setIsPermissionManagerOpen(true);
    };

    const closeRoleForm = () => {
        setIsRoleFormOpen(false);
        setEditingRole(null);
    };

    const closePermissionManager = () => {
        setIsPermissionManagerOpen(false);
        setManagingPermissionsRole(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Roles" />
            
            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Gestión de Roles
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Administra los roles y permisos del sistema
                                    </p>
                                    
                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>{roles.total} roles</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>{permissions.length} permisos</span>
                                        </div>
                                        {roles.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Pág. {roles.current_page}/{roles.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-roles-crear') && (
                                    <div className="hidden sm:block">
                                        <Button 
                                            onClick={openCreateRoleDialog}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Rol
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de roles - Responsive */}
                    <RolesTable
                        roles={roles}
                        onEdit={openEditRoleDialog}
                        onAssignPermissions={openPermissionManager}
                        userPermissions={userPermissions}
                    />

                    {/* Modales */}
                    <RoleForm
                        isOpen={isRoleFormOpen}
                        onClose={closeRoleForm}
                        role={editingRole}
                    />

                    <PermissionManager
                        isOpen={isPermissionManagerOpen}
                        onClose={closePermissionManager}
                        role={managingPermissionsRole}
                        permissions={permissions}
                    />
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-roles-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateRoleDialog}
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
