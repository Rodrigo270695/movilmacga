import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/components/ui/toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { requestPermission, hasPermission, error } = useGeolocation();
    const { addToast } = useToast();

    // Solicitar permisos de geolocalización al cargar el dashboard
    useEffect(() => {
        const requestLocationPermission = async () => {
            // Solo solicitar si no tenemos permisos y no se han denegado permanentemente
            if (!hasPermission && !localStorage.getItem('geolocation_denied')) {
                try {
                    const granted = await requestPermission();
                    if (granted) {
                        addToast({
                            type: 'success',
                            title: '¡Ubicación activada!',
                            message: 'Ahora puedes usar tu ubicación actual en los formularios.',
                            duration: 4000
                        });
                    } else {
                        // Marcar como denegado para no volver a solicitar en esta sesión
                        localStorage.setItem('geolocation_denied', 'true');
                        addToast({
                            type: 'info',
                            title: 'Ubicación no disponible',
                            message: 'Puedes activar la geolocalización desde la configuración del navegador.',
                            duration: 6000
                        });
                    }
                } catch (error) {
                    console.warn('Error solicitando permisos de geolocalización:', error);
                }
            }
        };

        // Retrasar la solicitud para dar tiempo a que se cargue la interfaz
        const timeoutId = setTimeout(requestLocationPermission, 2000);

        return () => clearTimeout(timeoutId);
    }, [hasPermission, requestPermission, addToast]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
