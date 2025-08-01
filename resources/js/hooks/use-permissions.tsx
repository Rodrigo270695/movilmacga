import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    permissions: string[];
    roles: Array<{
        id: number;
        name: string;
    }>;
}

interface AuthProps {
    user: User;
}

interface PageProps {
    auth: AuthProps;
}

/**
 * Hook personalizado para manejar permisos del usuario
 */
export function usePermissions() {
    const { props } = usePage<PageProps>();
    const userPermissions = props.auth?.user?.permissions || [];
    const userRoles = props.auth?.user?.roles || [];

    // Función para verificar si el usuario tiene un permiso específico
    const hasPermission = useMemo(() => {
        return (permission: string): boolean => {
            if (!permission) return true; // Si no requiere permiso, permitir acceso
            return userPermissions.includes(permission);
        };
    }, [userPermissions]);

    // Función para verificar si el usuario tiene uno de varios permisos
    const hasAnyPermission = useMemo(() => {
        return (permissions: string[]): boolean => {
            if (!permissions || permissions.length === 0) return true;
            return permissions.some(permission => userPermissions.includes(permission));
        };
    }, [userPermissions]);

    // Función para verificar si el usuario tiene todos los permisos especificados
    const hasAllPermissions = useMemo(() => {
        return (permissions: string[]): boolean => {
            if (!permissions || permissions.length === 0) return true;
            return permissions.every(permission => userPermissions.includes(permission));
        };
    }, [userPermissions]);

    // Función para verificar si el usuario tiene un rol específico
    const hasRole = useMemo(() => {
        return (roleName: string): boolean => {
            if (!roleName) return true;
            return userRoles.some(role => role.name === roleName);
        };
    }, [userRoles]);

    // Función para verificar si el usuario tiene uno de varios roles
    const hasAnyRole = useMemo(() => {
        return (roleNames: string[]): boolean => {
            if (!roleNames || roleNames.length === 0) return true;
            return roleNames.some(roleName =>
                userRoles.some(role => role.name === roleName)
            );
        };
    }, [userRoles]);

    return {
        userPermissions,
        userRoles,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
    };
}
