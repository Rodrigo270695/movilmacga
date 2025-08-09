import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import {
    Shield,
    LayoutGrid,
    Users,
    Cog,
    Eye,
    Zap,
    Globe,
    Settings,
    Folder,
    CircuitBoard,
    Route,
    Building2,
    MapPin,
    UserCheck,
    Map,
    Navigation,
    BarChart3
} from 'lucide-react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface PermissionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    role?: Role | null;
    permissions: Permission[];
}

// Definir estructura jerárquica del sistema de navegación
const menuStructure = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutGrid,
        className: 'text-blue-600 bg-blue-100',
        permission: 'menu-dashboard',
        actions: [
            { id: 'ver-dashboard', label: 'Ver dashboard' },
            { id: 'ver-estadisticas', label: 'Ver estadísticas' }
        ]
    },
    {
        id: 'admin',
        label: 'Administración',
        icon: Shield,
        className: 'text-purple-600 bg-purple-100',
        permission: 'menu-admin',
        items: [
            {
                id: 'roles',
                label: 'Gestión de Roles',
                icon: Users,
                className: 'text-green-600 bg-green-100',
                permission: 'gestor-roles-acceso',
                actions: [
                    { id: 'gestor-roles-ver', label: 'Ver roles' },
                    { id: 'gestor-roles-crear', label: 'Crear roles' },
                    { id: 'gestor-roles-editar', label: 'Editar roles' },
                    { id: 'gestor-roles-cambiar-estado', label: 'Activar/Desactivar roles' },
                    { id: 'gestor-roles-asignar-permisos', label: 'Asignar permisos' }
                ]
            },
            {
                id: 'businesses',
                label: 'Gestión de Negocios',
                icon: Building2,
                className: 'text-amber-600 bg-amber-100',
                permission: 'gestor-business-acceso',
                actions: [
                    { id: 'gestor-business-ver', label: 'Ver negocios' },
                    { id: 'gestor-business-crear', label: 'Crear negocios' },
                    { id: 'gestor-business-editar', label: 'Editar negocios' },
                    { id: 'gestor-business-cambiar-estado', label: 'Activar/Desactivar negocios' },
                    { id: 'gestor-business-eliminar', label: 'Eliminar negocios' }
                ]
            },
            {
                id: 'business-users',
                label: 'Gestión Usuario-Negocio',
                icon: Users,
                className: 'text-blue-600 bg-blue-100',
                permission: 'gestor-business-user-acceso',
                actions: [
                    { id: 'gestor-business-user-ver', label: 'Ver asignaciones' },
                    { id: 'gestor-business-user-asignar', label: 'Asignar usuarios' },
                    { id: 'gestor-business-user-desasignar', label: 'Desasignar usuarios' }
                ]
            },
            {
                id: 'usuarios',
                label: 'Gestión de Usuarios',
                icon: Users,
                className: 'text-orange-600 bg-orange-100',
                permission: 'gestor-usuarios-acceso',
                actions: [
                    { id: 'gestor-usuarios-ver', label: 'Ver usuarios' },
                    { id: 'gestor-usuarios-crear', label: 'Crear usuarios' },
                    { id: 'gestor-usuarios-editar', label: 'Editar usuarios' },
                    { id: 'gestor-usuarios-cambiar-estado', label: 'Activar/Desactivar usuarios' }
                ]
            }
        ]
    },
    {
        id: 'dcs',
        label: 'DCS',
        icon: Folder,
        className: 'text-indigo-600 bg-indigo-100',
        permission: 'menu-dcs',
        items: [
            {
                id: 'zonales',
                label: 'Gestión de Zonales',
                icon: LayoutGrid,
                className: 'text-cyan-600 bg-cyan-100',
                permission: 'gestor-zonal-acceso',
                actions: [
                    { id: 'gestor-zonal-ver', label: 'Ver zonales' },
                    { id: 'gestor-zonal-crear', label: 'Crear zonales' },
                    { id: 'gestor-zonal-editar', label: 'Editar zonales' },
                    { id: 'gestor-zonal-cambiar-estado', label: 'Activar/Desactivar zonales' }
                ]
            },
            {
                id: 'circuitos',
                label: 'Gestión de Circuitos',
                icon: CircuitBoard,
                className: 'text-teal-600 bg-teal-100',
                permission: 'gestor-circuito-acceso',
                actions: [
                    { id: 'gestor-circuito-ver', label: 'Ver circuitos' },
                    { id: 'gestor-circuito-crear', label: 'Crear circuitos' },
                    { id: 'gestor-circuito-editar', label: 'Editar circuitos' },
                    { id: 'gestor-circuito-cambiar-estado', label: 'Activar/Desactivar circuitos' }
                ]
            },
            {
                id: 'rutas',
                label: 'Gestión de Rutas',
                icon: Route,
                className: 'text-emerald-600 bg-emerald-100',
                permission: 'gestor-ruta-acceso',
                actions: [
                    { id: 'gestor-ruta-ver', label: 'Ver rutas' },
                    { id: 'gestor-ruta-crear', label: 'Crear rutas' },
                    { id: 'gestor-ruta-editar', label: 'Editar rutas' },
                    { id: 'gestor-ruta-cambiar-estado', label: 'Activar/Desactivar rutas' }
                ]
            },
            {
                id: 'pdvs',
                label: 'Gestión de PDVs',
                icon: MapPin,
                className: 'text-pink-600 bg-pink-100',
                permission: 'gestor-pdv-acceso',
                actions: [
                    { id: 'gestor-pdv-ver', label: 'Ver PDVs' },
                    { id: 'gestor-pdv-crear', label: 'Crear PDVs' },
                    { id: 'gestor-pdv-editar', label: 'Editar PDVs' },
                    { id: 'gestor-pdv-cambiar-estado', label: 'Activar/Desactivar PDVs' }
                ]
            },
            {
                id: 'supervisor-zonal',
                label: 'Supervisor-Zonal',
                icon: UserCheck,
                className: 'text-violet-600 bg-violet-100',
                permission: 'gestor-zonal-supervisor-acceso',
                actions: [
                    { id: 'gestor-zonal-supervisor-ver', label: 'Ver asignaciones' },
                    { id: 'gestor-zonal-supervisor-asignar', label: 'Asignar supervisores' },
                    { id: 'gestor-zonal-supervisor-desasignar', label: 'Desasignar supervisores' }
                ]
            },
            {
                id: 'vendedor-circuito',
                label: 'Vendedor-Circuito',
                icon: Users,
                className: 'text-indigo-600 bg-indigo-100',
                permission: 'gestor-vendedor-circuito-acceso',
                actions: [
                    { id: 'gestor-vendedor-circuito-ver', label: 'Ver asignaciones' },
                    { id: 'gestor-vendedor-circuito-asignar', label: 'Asignar vendedores' },
                    { id: 'gestor-vendedor-circuito-desasignar', label: 'Desasignar vendedores' }
                ]
            }
        ]
    },
    {
        id: 'mapas',
        label: 'Mapas',
        icon: Map,
        className: 'text-blue-600 bg-blue-100',
        permission: 'menu-mapas',
        items: [
            {
                id: 'rastreo-vendedores',
                label: 'Rastreo de Vendedores',
                icon: Navigation,
                className: 'text-sky-600 bg-sky-100',
                permission: 'mapa-rastreo-vendedores-acceso',
                actions: [
                    { id: 'mapa-rastreo-vendedores-ver', label: 'Ver mapa de tracking' },
                    { id: 'mapa-rastreo-vendedores-tiempo-real', label: 'Tracking en tiempo real' },
                    { id: 'mapa-rastreo-vendedores-historial', label: 'Ver historial de ubicaciones' }
                ]
            }
        ]
    },
    {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        className: 'text-emerald-600 bg-emerald-100',
        permission: 'menu-reportes',
        items: [
            {
                id: 'pdvs-visitados',
                label: 'PDVs Visitados',
                icon: MapPin,
                className: 'text-green-600 bg-green-100',
                permission: 'reporte-pdvs-visitados-acceso',
                actions: [
                    { id: 'reporte-pdvs-visitados-ver', label: 'Ver reporte de PDVs visitados' },
                    { id: 'reporte-pdvs-visitados-exportar', label: 'Exportar reporte a Excel/PDF' }
                ]
            }
        ]
    },
    {
        id: 'configuracion',
        label: 'Configuración',
        icon: Cog,
        className: 'text-gray-600 bg-gray-100',
        permission: 'configuracion-acceso',
        actions: [
            { id: 'configuracion-general', label: 'Configuración general' },
            { id: 'configuracion-seguridad', label: 'Configuración de seguridad' }
        ]
    }
];

const actionLabels: Record<string, string> = {
    'ver-dashboard': 'Ver dashboard',
    'ver-estadisticas': 'Ver estadísticas',
    'gestor-roles-ver': 'Ver roles',
    'gestor-roles-crear': 'Crear roles',
    'gestor-roles-editar': 'Editar roles',
    'gestor-roles-eliminar': 'Eliminar roles',
    'gestor-roles-cambiar-estado': 'Activar/Desactivar roles',
    'gestor-roles-asignar-permisos': 'Asignar permisos a roles',

    'gestor-business-ver': 'Ver negocios del sistema',
    'gestor-business-crear': 'Crear nuevos negocios',
    'gestor-business-editar': 'Editar negocios existentes',
    'gestor-business-eliminar': 'Eliminar negocios',
    'gestor-business-cambiar-estado': 'Activar/Desactivar negocios',

    'gestor-business-user-ver': 'Ver asignaciones de usuarios a negocios',
    'gestor-business-user-asignar': 'Asignar usuarios a negocios',
    'gestor-business-user-desasignar': 'Desasignar usuarios de negocios',

    'gestor-usuarios-ver': 'Ver usuarios',
    'gestor-usuarios-crear': 'Crear usuarios',
    'gestor-usuarios-editar': 'Editar usuarios',
    'gestor-usuarios-eliminar': 'Eliminar usuarios',
    'gestor-usuarios-cambiar-estado': 'Activar/Desactivar usuarios',
    'gestor-zonal-ver': 'Ver zonales del sistema',
    'gestor-zonal-crear': 'Crear nuevos zonales',
    'gestor-zonal-editar': 'Editar zonales existentes',
    'gestor-zonal-eliminar': 'Eliminar zonales',
    'gestor-zonal-cambiar-estado': 'Activar/Desactivar zonales',

    'gestor-circuito-ver': 'Ver circuitos del sistema',
    'gestor-circuito-crear': 'Crear nuevos circuitos',
    'gestor-circuito-editar': 'Editar circuitos existentes',
    'gestor-circuito-eliminar': 'Eliminar circuitos',
    'gestor-circuito-cambiar-estado': 'Activar/Desactivar circuitos',

    'gestor-ruta-ver': 'Ver rutas del sistema',
    'gestor-ruta-crear': 'Crear nuevas rutas',
    'gestor-ruta-editar': 'Editar rutas existentes',
    'gestor-ruta-eliminar': 'Eliminar rutas',
    'gestor-ruta-cambiar-estado': 'Activar/Desactivar rutas',

    'gestor-pdv-ver': 'Ver PDVs del sistema',
    'gestor-pdv-crear': 'Crear nuevos PDVs',
    'gestor-pdv-editar': 'Editar PDVs existentes',
    'gestor-pdv-eliminar': 'Eliminar PDVs',
    'gestor-pdv-cambiar-estado': 'Activar/Desactivar PDVs',

    'gestor-zonal-supervisor-ver': 'Ver asignaciones de supervisores a zonales',
    'gestor-zonal-supervisor-asignar': 'Asignar supervisores a zonales',
    'gestor-zonal-supervisor-desasignar': 'Desasignar supervisores de zonales',

    'gestor-vendedor-circuito-ver': 'Ver asignaciones de vendedores a circuitos',
    'gestor-vendedor-circuito-asignar': 'Asignar vendedores a circuitos',
    'gestor-vendedor-circuito-desasignar': 'Desasignar vendedores de circuitos',

    'mapa-rastreo-vendedores-ver': 'Ver mapa de tracking de vendedores',
    'mapa-rastreo-vendedores-tiempo-real': 'Monitoreo en tiempo real de vendedores',
    'mapa-rastreo-vendedores-historial': 'Ver historial de ubicaciones de vendedores',

    'reporte-pdvs-visitados-ver': 'Ver reporte de PDVs visitados',
    'reporte-pdvs-visitados-exportar': 'Exportar reporte de PDVs visitados',

    'configuracion-general': 'Configuración general del sistema',
    'configuracion-seguridad': 'Configuración de seguridad'
};

export function PermissionManager({ isOpen, onClose, role, permissions }: PermissionManagerProps) {
    // Estilos CSS para scrollbar personalizado
    const scrollbarStyles = `
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
    `;
    const { addToast } = useToast();
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('access');

    // Cargar permisos existentes del rol
    useEffect(() => {
        if (role && isOpen) {
            setSelectedPermissions(role.permissions.map(p => p.name));
        } else if (!role && isOpen) {
            setSelectedPermissions([]);
        }
    }, [role?.id, role?.permissions?.length, isOpen]);

    // Limpiar estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setSelectedPermissions([]);
            setIsSubmitting(false);
            setActiveTab('access');
        }
    }, [isOpen]);

    const handleMenuToggle = (menuId: string, permission: string, actions: any[], items: any[]) => {
        setSelectedPermissions(prev => {
            let newPermissions = [...prev];
            const hasAccess = newPermissions.includes(permission);

            if (hasAccess) {
                // Quitar acceso al menú y todos sus elementos
                newPermissions = newPermissions.filter(p => {
                    if (p === permission) return false;
                    // Quitar acciones directas del menú
                    if (actions.some(action => action.id === p)) return false;
                    // Quitar sub-items y sus acciones
                    if (items.some(item => {
                        if (item.permission === p) return true;
                        return item.actions?.some((action: any) => action.id === p) || false;
                    })) return false;
                    return true;
                });
            } else {
                // Agregar acceso al menú
                newPermissions.push(permission);
            }

            return newPermissions;
        });
    };

    const handleSubItemToggle = (permission: string, actions: any[]) => {
        setSelectedPermissions(prev => {
            let newPermissions = [...prev];
            const hasAccess = newPermissions.includes(permission);

            if (hasAccess) {
                // Quitar sub-item y sus acciones
                newPermissions = newPermissions.filter(p => {
                    if (p === permission) return false;
                    if (actions.some(action => action.id === p)) return false;
                    return true;
                });
            } else {
                // Agregar sub-item
                newPermissions.push(permission);
            }

            return newPermissions;
        });
    };

    const handlePermissionToggle = (permissionName: string) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionName)) {
                return prev.filter(p => p !== permissionName);
            } else {
                return [...prev, permissionName];
            }
        });
    };

    // Obtener módulos con acceso
    const modulesWithAccess = useMemo(() => {
        const result: any[] = [];

        menuStructure.forEach(menuItem => {
            // Agregar módulos de nivel superior con acciones
            if (selectedPermissions.includes(menuItem.permission) && menuItem.actions) {
                result.push({
                    id: menuItem.id,
                    label: menuItem.label,
                    icon: menuItem.icon,
                    className: menuItem.className,
                    actions: menuItem.actions
                });
            }

            // Agregar sub-items con acceso
            if (menuItem.items) {
                menuItem.items.forEach(subItem => {
                    if (selectedPermissions.includes(subItem.permission)) {
                        result.push({
                            id: subItem.id,
                            label: subItem.label,
                            icon: subItem.icon,
                            className: subItem.className,
                            actions: subItem.actions || []
                        });
                    }
                });
            }
        });

        return result;
    }, [selectedPermissions]);

    const handleSubmit = () => {
        if (!role) return;

        setIsSubmitting(true);

        router.patch(route('admin.roles.update', role.id), {
            permissions: selectedPermissions
        }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Permisos actualizados!',
                    message: `Los permisos del rol "${role.name}" han sido actualizados correctamente.`,
                    duration: 4000
                });
                onClose();
                // Forzar recarga completa de datos para evitar problemas de caché
                setTimeout(() => {
                    router.visit(route('admin.roles.index'), {
                        preserveState: false,
                        preserveScroll: false,
                        replace: true
                    });
                }, 100);
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudieron actualizar los permisos. Inténtalo de nuevo.',
                    duration: 4000
                });
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!role) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="max-w-[95vw] sm:max-w-6xl w-full mx-auto h-[85vh] overflow-hidden flex flex-col"
                    style={{ width: '90vw', maxWidth: '1200px' }}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                <DialogHeader className="flex-shrink-0 pb-4">
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                            <Settings className="w-4 h-4 text-green-600" />
                        </div>
                        Gestionar Permisos
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Rol: <span className="font-medium text-gray-900">{role.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0 transition-all duration-200 ease-out">
                            <TabsTrigger value="access" className="flex items-center gap-2 text-sm transition-all duration-200 ease-out hover:scale-105">
                                <Globe className="w-4 h-4 transition-transform duration-200 ease-out" />
                                <span className="hidden sm:inline">Acceso a Módulos</span>
                                <span className="sm:hidden">Módulos</span>
                            </TabsTrigger>
                            <TabsTrigger value="actions" className="flex items-center gap-2 text-sm transition-all duration-200 ease-out hover:scale-105">
                                <Zap className="w-4 h-4 transition-transform duration-200 ease-out" />
                                <span className="hidden sm:inline">Permisos de Acciones</span>
                                <span className="sm:hidden">Acciones</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-hidden min-h-0" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                            <TabsContent value="access" className="h-full m-0">
                                <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden" style={{ maxHeight: 'calc(85vh - 250px)' }}>
                                    {/* Estructura de menú jerárquica */}
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 250px)' }}>
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                                            Estructura del menú de navegación:
                                        </h3>
                                        <div className="space-y-2">
                                            {menuStructure.map((menuItem) => {
                                                const MenuIcon = menuItem.icon;
                                                const hasMenuAccess = selectedPermissions.includes(menuItem.permission);

                                                return (
                                                    <div key={menuItem.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-200 ease-out hover:shadow-sm">
                                                        {/* Menú principal */}
                                                        <div
                                                            className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 ease-out ${
                                                                hasMenuAccess ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                                            }`}
                                                            onClick={() => handleMenuToggle(menuItem.id, menuItem.permission, menuItem.actions || [], menuItem.items || [])}
                                                        >
                                                            <Checkbox
                                                                checked={hasMenuAccess}
                                                                onCheckedChange={(checked) =>
                                                                    handleMenuToggle(menuItem.id, menuItem.permission, menuItem.actions || [], menuItem.items || [])
                                                                }
                                                                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer transition-all duration-150 ease-out hover:scale-105"
                                                            />
                                                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 ${menuItem.className}`}>
                                                                <MenuIcon className="w-3 h-3 transition-transform duration-200 ease-out" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 flex-1">
                                                                {menuItem.label}
                                                            </span>
                                                            {menuItem.items && (
                                                                                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded transition-all duration-200 ease-out hover:bg-gray-200 hover:text-gray-600">
                                                                                {menuItem.items.length} {menuItem.items.length === 1 ? 'item' : 'items'}
                                                                            </span>
                                                            )}
                                                        </div>

                                                        {/* Sub-items */}
                                                        {menuItem.items && hasMenuAccess && (
                                                            <div className="border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-300 ease-out">
                                                                {menuItem.items.map((subItem, index) => {
                                                                    const SubIcon = subItem.icon;
                                                                    const hasSubAccess = selectedPermissions.includes(subItem.permission);

                                                                    return (
                                                                        <div
                                                                            key={subItem.id}
                                                                            className={`flex items-center gap-3 p-3 pl-8 cursor-pointer transition-all duration-200 ease-out border-l-2 ml-6 hover:translate-x-1 ${
                                                                                hasSubAccess
                                                                                    ? 'border-l-green-400 bg-green-50 shadow-sm'
                                                                                    : 'border-l-gray-200 hover:bg-gray-50 hover:border-l-green-300'
                                                                            }`}
                                                                            style={{
                                                                                animationDelay: `${index * 50}ms`
                                                                            }}
                                                                            onClick={() => handleSubItemToggle(subItem.permission, subItem.actions || [])}
                                                                        >
                                                                            <Checkbox
                                                                                checked={hasSubAccess}
                                                                                onCheckedChange={() => handleSubItemToggle(subItem.permission, subItem.actions || [])}
                                                                                className="border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 cursor-pointer transition-all duration-150 ease-out hover:scale-105"
                                                                            />
                                                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 ${subItem.className}`}>
                                                                                <SubIcon className="w-3 h-3 transition-transform duration-200 ease-out" />
                                                                            </div>
                                                                            <span className="text-sm text-gray-700 flex-1">
                                                                                {subItem.label}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                                                                {subItem.actions?.length || 0} acciones
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Preview en tiempo real */}
                                    <div className="w-full lg:w-80 bg-gray-50 rounded-lg p-4 border border-gray-200 flex-shrink-0 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 250px)' }}>
                                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Vista previa en tiempo real
                                        </h3>
                                        <div className="space-y-2">
                                            {menuStructure.map((menuItem) => {
                                                const hasMenuAccess = selectedPermissions.includes(menuItem.permission);
                                                if (!hasMenuAccess) return null;

                                                const MenuIcon = menuItem.icon;
                                                const visibleSubItems = menuItem.items?.filter(subItem =>
                                                    selectedPermissions.includes(subItem.permission)
                                                ) || [];

                                                                                                                return (
                                                                    <div key={`preview-${menuItem.id}`} className="bg-white rounded border transition-all duration-200 ease-out hover:shadow-sm animate-in fade-in-0 slide-in-from-left-2">
                                                                        <div className="flex items-center gap-2 p-2">
                                                                            <MenuIcon className="w-4 h-4 transition-transform duration-200 ease-out hover:scale-110" style={{ color: menuItem.className.includes('blue') ? '#2563eb' :
                                                                                                                   menuItem.className.includes('purple') ? '#7c3aed' :
                                                                                                                   menuItem.className.includes('indigo') ? '#4f46e5' :
                                                                                                                   menuItem.className.includes('gray') ? '#6b7280' : '#2563eb' }} />
                                                                            <span className="text-sm text-gray-700 transition-colors duration-200 ease-out">{menuItem.label}</span>
                                                                        </div>
                                                                                                                                {visibleSubItems.length > 0 && (
                                                                            <div className="pl-6 pb-2 border-t border-gray-100 pt-1 mt-1 animate-in slide-in-from-top-1 duration-300 ease-out">
                                                                                {visibleSubItems.map((subItem, index) => {
                                                                                    const SubIcon = subItem.icon;
                                                                                    return (
                                                                                        <div key={`preview-sub-${subItem.id}`} className="flex items-center gap-2 p-1 text-xs text-gray-600 transition-all duration-200 ease-out hover:text-gray-800 animate-in fade-in-0 slide-in-from-left-1" style={{ animationDelay: `${index * 75}ms` }}>
                                                                                            <SubIcon className="w-3 h-3 transition-transform duration-200 ease-out hover:scale-110" />
                                                                                            <span className="transition-colors duration-200 ease-out">{subItem.label}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {!menuStructure.some(item => selectedPermissions.includes(item.permission)) && (
                                                <div className="text-center py-6 text-gray-400">
                                                    <Eye className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                                    <p className="text-xs">Selecciona elementos del menú para ver el preview</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="actions" className="h-full m-0">
                                <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 250px)' }}>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                Selecciona las acciones específicas para cada módulo:
                                            </h3>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 transition-all duration-200 ease-out hover:bg-blue-200 hover:scale-105">
                                                {selectedPermissions.length} {selectedPermissions.length === 1 ? 'permiso seleccionado' : 'permisos seleccionados'}
                                            </Badge>
                                        </div>

                                        {modulesWithAccess.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-sm">Primero selecciona módulos en la pestaña "Acceso a Módulos"</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {modulesWithAccess.map((module, moduleIndex) => (
                                                    <div key={module.id} className="border border-gray-200 rounded-lg bg-white transition-all duration-200 ease-out hover:shadow-sm animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: `${moduleIndex * 100}ms` }}>
                                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 transition-colors duration-200 ease-out hover:bg-gray-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 ${module.className}`}>
                                                                    <module.icon className="w-3 h-3 transition-transform duration-200 ease-out" />
                                                                </div>
                                                                <h4 className="font-medium text-gray-900 text-sm transition-colors duration-200 ease-out">{module.label}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="p-4">
                                                            {module.actions.length === 0 ? (
                                                                <p className="text-sm text-gray-500 italic text-center py-2">
                                                                    No hay acciones específicas para este módulo
                                                                </p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {module.actions.map((action: any) => (
                                                                        <div key={action.id} className="flex items-center space-x-2 transition-all duration-200 ease-out hover:bg-gray-50 rounded p-1 hover:translate-x-1">
                                                                            <Checkbox
                                                                                id={`action-${action.id}`}
                                                                                checked={selectedPermissions.includes(action.id)}
                                                                                onCheckedChange={() => handlePermissionToggle(action.id)}
                                                                                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer transition-all duration-150 ease-out hover:scale-105"
                                                                            />
                                                                            <Label
                                                                                htmlFor={`action-${action.id}`}
                                                                                className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 flex-1 leading-tight transition-colors duration-200 ease-out"
                                                                            >
                                                                                {action.label}
                                                                            </Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto cursor-pointer order-2 sm:order-1 transition-all duration-200 ease-out hover:scale-105 hover:shadow-sm"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2 transition-all duration-200 ease-out hover:scale-105 hover:shadow-md active:scale-95"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Guardando...</span>
                                </div>
                            ) : (
                                <span>Guardar Permisos</span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
