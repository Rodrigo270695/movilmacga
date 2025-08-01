import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    // Forzar siempre tema claro - eliminar cualquier clase 'dark'
    document.documentElement.classList.remove('dark');

    // Asegurar que no se aplique tema oscuro nunca
    const isDark = false; // Siempre false para tema claro
    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    // Forzar siempre tema claro
    const forcedAppearance = 'light';

    applyTheme(forcedAppearance);

    // Guardar en localStorage para consistencia
    localStorage.setItem('appearance', forcedAppearance);

    // No necesitamos escuchar cambios del sistema ya que siempre usamos light
    // mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    // Forzar siempre tema claro
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        // Ignorar cualquier intento de cambio y mantener siempre 'light'
        const forcedMode = 'light';
        setAppearance(forcedMode);

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', forcedMode);

        // Store in cookie for SSR...
        setCookie('appearance', forcedMode);

        applyTheme(forcedMode);
    }, []);

    useEffect(() => {
        // Siempre forzar tema claro, ignorar lo guardado anteriormente
        updateAppearance('light');

        // No necesitamos cleanup ya que no escuchamos cambios del sistema
        return () => {};
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
