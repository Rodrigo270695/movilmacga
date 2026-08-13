import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { Building2, MapPin, Repeat2, Timer, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Business {
    id: number;
    name: string;
    status: boolean | number;
    max_visit_distance_meters: number;
    min_visit_duration_minutes: number;
    max_visits_per_pdv_per_day: number;
}

interface Props {
    businesses: Business[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '#' },
    { title: 'Configuración de Visitas', href: '/admin/visit-settings' },
];

function BusinessSettingsCard({ business }: { business: Business }) {
    const { addToast } = useToast();
    const [maxDistance, setMaxDistance] = useState(String(business.max_visit_distance_meters));
    const [minDuration, setMinDuration] = useState(String(business.min_visit_duration_minutes));
    const [maxVisitsPerDay, setMaxVisitsPerDay] = useState(String(business.max_visits_per_pdv_per_day ?? 2));
    const [saving, setSaving] = useState(false);

    const isDirty =
        Number(maxDistance) !== business.max_visit_distance_meters ||
        Number(minDuration) !== business.min_visit_duration_minutes ||
        Number(maxVisitsPerDay) !== (business.max_visits_per_pdv_per_day ?? 2);

    const handleSave = () => {
        setSaving(true);
        router.patch(
            `/admin/visit-settings/${business.id}`,
            {
                max_visit_distance_meters: Number(maxDistance),
                min_visit_duration_minutes: Number(minDuration),
                max_visits_per_pdv_per_day: Number(maxVisitsPerDay),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: '¡Guardado!',
                        message: `Configuración de '${business.name}' actualizada.`,
                        duration: 3500,
                    });
                },
                onError: () => {
                    addToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo guardar la configuración. Verifica los valores.',
                        duration: 4000,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{business.name}</h3>
                        <Badge variant={business.status ? 'default' : 'secondary'} className="mt-0.5">
                            {business.status ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor={`distance-${business.id}`} className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Distancia máxima para visitar (metros)
                    </Label>
                    <Input
                        id={`distance-${business.id}`}
                        type="number"
                        min={1}
                        max={5000}
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        El vendedor debe estar a menos de esta distancia del PDV para iniciar la visita.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={`duration-${business.id}`} className="flex items-center gap-1.5 text-gray-700">
                        <Timer className="h-4 w-4 text-gray-400" />
                        Tiempo mínimo para finalizar (minutos)
                    </Label>
                    <Input
                        id={`duration-${business.id}`}
                        type="number"
                        min={0}
                        max={180}
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        El botón "Finalizar Visita" permanecerá bloqueado hasta cumplir este tiempo.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={`visits-${business.id}`} className="flex items-center gap-1.5 text-gray-700">
                        <Repeat2 className="h-4 w-4 text-gray-400" />
                        Visitas máximas al mismo PDV (por día)
                    </Label>
                    <Input
                        id={`visits-${business.id}`}
                        type="number"
                        min={1}
                        max={10}
                        value={maxVisitsPerDay}
                        onChange={(e) => setMaxVisitsPerDay(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        Cuántas veces el vendedor puede visitar el mismo PDV en un mismo día. Por defecto 2.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!isDirty || saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
            </div>
        </div>
    );
}

export default function VisitSettingsIndex({ businesses, flash }: Props) {
    const { addToast } = useToast();

    useEffect(() => {
        if (flash?.success) {
            addToast({ type: 'success', title: '¡Éxito!', message: flash.success, duration: 4000 });
        }
        if (flash?.error) {
            addToast({ type: 'error', title: 'Error', message: flash.error, duration: 5000 });
        }
    }, [flash, addToast]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de Visitas" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Configuración de Visitas</h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Define, por cada marca/negocio, la distancia máxima permitida para registrar una
                                visita, el tiempo mínimo para finalizarla y cuántas veces se puede visitar el mismo
                                PDV en un mismo día. Los cambios aplican de inmediato en la app móvil.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {businesses.map((business) => (
                            <BusinessSettingsCard key={business.id} business={business} />
                        ))}
                    </div>

                    {businesses.length === 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-500">
                            No hay negocios registrados todavía.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
