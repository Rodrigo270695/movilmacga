import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Folder, LayoutGrid, Shield, Users, CircuitBoard, Route, Building2, MapPin, UserCheck, Map, Navigation } from 'lucide-react';
import AppLogo from './app-logo';
import { usePage } from '@inertiajs/react';
import { useMemo, useCallback } from 'react';

// Definir estructura completa de navegación con permisos requeridos
const allNavItems: (NavItem & { permission?: string })[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        permission: 'menu-dashboard',
    },
    {
        title: 'Admin',
        icon: Shield,
        permission: 'menu-admin',
        items: [
            {
                title: 'Gestor de rol',
                href: '/admin/roles',
                icon: Users,
                permission: 'gestor-roles-acceso',
            },
            {
                title: 'Gestor de negocio',
                href: '/admin/businesses',
                icon: Building2,
                permission: 'gestor-business-acceso',
            },
            {
                title: 'Gestor de usuarios',
                href: '/admin/users',
                icon: Users,
                permission: 'gestor-usuarios-acceso',
            },
        ],
    },
    {
        title: 'DCS',
        icon: Folder,
        permission: 'menu-dcs',
        items: [
            {
                title: 'Gestor de zonal',
                href: '/dcs/zonales',
                icon: LayoutGrid,
                permission: 'gestor-zonal-acceso',
            },
            {
                title: 'Gestor de circuitos',
                href: '/dcs/circuits',
                icon: CircuitBoard,
                permission: 'gestor-circuito-acceso',
            },
            {
                title: 'Gestor de rutas',
                href: '/dcs/routes',
                icon: Route,
                permission: 'gestor-ruta-acceso',
            },
            {
                title: 'Gestor de PDVs',
                href: '/dcs/pdvs',
                icon: MapPin,
                permission: 'gestor-pdv-acceso',
            },
            {
                title: 'Supervisor-Zonal',
                href: '/dcs/zonal-supervisors',
                icon: UserCheck,
                permission: 'gestor-zonal-supervisor-acceso',
            },
            {
                title: 'Vendedor-Circuito',
                href: '/dcs/vendor-circuits',
                icon: Users,
                permission: 'gestor-vendedor-circuito-acceso',
            },
        ],
    },
    {
        title: 'Mapas',
        icon: Map,
        permission: 'menu-mapas',
        items: [
            {
                title: 'Rastreo de vendedores',
                href: '/mapas/tracking',
                icon: Navigation,
                permission: 'mapa-rastreo-vendedores-acceso',
                openInNewTab: true,
            },
        ],
    },
];


export function AppSidebar() {
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };

    const userPermissions = useMemo(() => {
        return auth?.user?.permissions || [];
    }, [auth?.user?.permissions]);

    // Función para verificar si el usuario tiene un permiso
    const hasPermission = useCallback((permission?: string): boolean => {
        if (!permission) return true; // Si no requiere permiso, mostrar
        return userPermissions.includes(permission);
    }, [userPermissions]);

    // Memoizar la función para filtrar items del menú basándose en permisos
    const filterNavItems = useMemo(() => {
        const filter = (items: (NavItem & { permission?: string })[]): NavItem[] => {
            return items
                .filter(item => hasPermission(item.permission))
                .map(item => {
                    if (item.items) {
                        const filteredSubItems = filter(item.items as (NavItem & { permission?: string })[]);
                        // Solo mostrar el menú padre si tiene sub-items visibles
                        if (filteredSubItems.length === 0) {
                            return null;
                        }
                        return { ...item, items: filteredSubItems };
                    }
                    return item;
                })
                .filter(Boolean) as NavItem[];
        };
        return filter;
    }, [hasPermission]);

    // Memoizar el resultado del filtrado para evitar re-renders innecesarios
    const visibleNavItems = useMemo(() => filterNavItems(allNavItems), [filterNavItems]);

        return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
