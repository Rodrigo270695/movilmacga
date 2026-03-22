/**
 * Reporte Tipo de negocio: mismos criterios de alcance y filtros que
 * `dcs/negocio-operador/global-index` (datos vía `TipoNegocioReportController`
 * extendiendo `NegocioOperadorController`: negocio/zonal/circuito/ruta y vendedor).
 */
import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { X, Filter, Map } from 'lucide-react';
import {
    TipoNegocioMapView,
    type TipoNegocioMapFilters,
} from '@/components/reportes/tipo-negocio-map-view';

function idStr(v: string | number | undefined | null): string {
    return v !== undefined && v !== null && v !== '' ? String(v) : '';
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id?: number;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
}

interface RouteOpt {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
}

interface BusinessTypeOption {
    value: string;
    label: string;
}

interface Props {
    businesses: Business[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    allRoutes: RouteOpt[];
    /** Todos los tipos (enum pdv_business_types); el mapa combina este filtro con negocio/zonal/circuito/ruta. */
    businessTypeOptions?: BusinessTypeOption[];
    isVendor: boolean;
    visitDateTodayFormatted: string;
    filters: {
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
        route_id?: string;
        business_type?: string | null;
    };
    flash?: { success?: string; error?: string };
}

export default function ReporteTipoNegocioIndex({
    businesses,
    allZonales,
    allCircuits,
    allRoutes,
    businessTypeOptions: businessTypeOptionsProp,
    isVendor,
    visitDateTodayFormatted,
    filters,
    flash,
}: Props) {
    const businessTypeOptions = Array.isArray(businessTypeOptionsProp) ? businessTypeOptionsProp : [];

    const { addToast } = useToast();
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = auth?.user?.permissions || [];
    const hasPermission = (p: string) => userPermissions.includes(p);

    const [selectedBusiness, setSelectedBusiness] = useState(idStr(filters.business_id));
    const [selectedZonal, setSelectedZonal] = useState(idStr(filters.zonal_id));
    const [selectedCircuit, setSelectedCircuit] = useState(idStr(filters.circuit_id));
    const [selectedRoute, setSelectedRoute] = useState(idStr(filters.route_id));
    const [selectedBusinessType, setSelectedBusinessType] = useState(idStr(filters.business_type));
    /** Filtros con los que se cargó el mapa por última vez (solo al pulsar «Ver mapa»). */
    const [mapFiltersForView, setMapFiltersForView] = useState<TipoNegocioMapFilters | null>(null);

    const canViewMap = hasPermission('reporte-tipo-negocio-ver');

    const mapFiltersFromSelection = useMemo(
        (): TipoNegocioMapFilters => ({
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            business_type: selectedBusinessType || undefined,
        }),
        [isVendor, selectedBusiness, selectedZonal, selectedCircuit, selectedRoute, selectedBusinessType]
    );

    const handleVerMapa = () => {
        setMapFiltersForView({ ...mapFiltersFromSelection });
    };

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Reportes', href: '#' },
            { title: 'Tipo de negocio', href: '/reportes/tipo-de-negocio' },
        ],
        []
    );

    const filteredZonales = useMemo(() => {
        if (isVendor) {
            return Array.isArray(allZonales) ? allZonales : [];
        }
        return selectedBusiness && Array.isArray(allZonales)
            ? allZonales.filter((z) => z.business_id?.toString() === selectedBusiness)
            : Array.isArray(allZonales)
              ? allZonales
              : [];
    }, [isVendor, selectedBusiness, allZonales]);

    const filteredCircuits = useMemo(() => {
        if (!selectedZonal) return Array.isArray(allCircuits) ? allCircuits : [];
        return Array.isArray(allCircuits)
            ? allCircuits.filter((c) => c.zonal_id?.toString() === selectedZonal)
            : [];
    }, [selectedZonal, allCircuits]);

    const filteredRoutes = useMemo(() => {
        if (!selectedCircuit) return Array.isArray(allRoutes) ? allRoutes : [];
        return Array.isArray(allRoutes)
            ? allRoutes.filter((r) => r.circuit_id?.toString() === selectedCircuit)
            : [];
    }, [selectedCircuit, allRoutes]);

    useEffect(() => {
        if (flash?.success) addToast({ type: 'success', title: 'Éxito', message: flash.success, duration: 4000 });
        if (flash?.error) addToast({ type: 'error', title: 'Error', message: flash.error, duration: 5000 });
    }, [flash?.success, flash?.error, addToast]);

    useEffect(() => {
        setSelectedBusiness(idStr(filters.business_id));
        setSelectedZonal(idStr(filters.zonal_id));
        setSelectedCircuit(idStr(filters.circuit_id));
        setSelectedRoute(idStr(filters.route_id));
        setSelectedBusinessType(idStr(filters.business_type));
    }, [filters.business_id, filters.zonal_id, filters.circuit_id, filters.route_id, filters.business_type]);

    /** Query de filtros jerárquicos (sin búsqueda; alineado con alcance del reporte). */
    const queryFromUi = (overrides: Record<string, string | undefined> = {}) => ({
        business_id:
            overrides.business_id !== undefined
                ? overrides.business_id
                : isVendor
                  ? undefined
                  : selectedBusiness || undefined,
        zonal_id: overrides.zonal_id !== undefined ? overrides.zonal_id : selectedZonal || undefined,
        circuit_id: overrides.circuit_id !== undefined ? overrides.circuit_id : selectedCircuit || undefined,
        route_id: overrides.route_id !== undefined ? overrides.route_id : selectedRoute || undefined,
        business_type:
            overrides.business_type !== undefined ? overrides.business_type : selectedBusinessType || undefined,
    });

    const handleBusinessFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedBusiness(val);
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(
            route('reportes.tipo-de-negocio.index'),
            queryFromUi({
                business_id: val || undefined,
                zonal_id: undefined,
                circuit_id: undefined,
                route_id: undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleZonalFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedZonal(val);
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(
            route('reportes.tipo-de-negocio.index'),
            queryFromUi({
                zonal_id: val || undefined,
                circuit_id: undefined,
                route_id: undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleCircuitFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedCircuit(val);
        setSelectedRoute('');
        router.get(
            route('reportes.tipo-de-negocio.index'),
            queryFromUi({
                circuit_id: val || undefined,
                route_id: undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleRouteFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedRoute(val);
        router.get(
            route('reportes.tipo-de-negocio.index'),
            queryFromUi({
                route_id: val || undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleBusinessTypeFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedBusinessType(val);
        router.get(
            route('reportes.tipo-de-negocio.index'),
            queryFromUi({
                business_type: val || undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        setSelectedBusiness('');
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        setSelectedBusinessType('');
        setMapFiltersForView(null);
        router.get(route('reportes.tipo-de-negocio.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = !!(
        (!isVendor && selectedBusiness) ||
        selectedZonal ||
        selectedCircuit ||
        selectedRoute ||
        selectedBusinessType
    );

    const zonalDisabled = !isVendor && !selectedBusiness;
    const circuitDisabled = !selectedZonal;
    const routeDisabled = !selectedCircuit;

    const businessTypeSelectValue =
        selectedBusinessType &&
        businessTypeOptions.some((b) => b.value === selectedBusinessType)
            ? selectedBusinessType
            : 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporte Tipo de negocio" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-6">
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">
                                        Reporte Tipo de negocio
                                    </h1>
                                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                        Vista alineada con Negocio - Operador: mismos filtros, alcance de negocio/zonal y
                                        criterios de vendedor. La matriz prepago/pospago por tipo de negocio se gestiona
                                        en DCS → Negocio - Operador; el mapa usa esas mismas filas (tipo de negocio,
                                        prepago/pospago y operador activo).
                                        {isVendor && (
                                            <span className="mt-1 block text-amber-700">
                                                Vendedor: rutas con visita programada para hoy (
                                                {visitDateTodayFormatted}) en tus circuitos asignados.
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Filtros</span>
                                </div>
                                {canViewMap && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleVerMapa}
                                        className="w-full shrink-0 cursor-pointer border-pink-600 text-pink-600 hover:bg-pink-50 hover:border-pink-700 hover:text-pink-700 sm:w-auto"
                                        title="Cargar o actualizar el mapa con los filtros actuales"
                                    >
                                        <Map className="mr-2 h-4 w-4" />
                                        Ver mapa
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                                    {!isVendor && (
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-medium text-gray-600">Negocio</span>
                                            <Select
                                                value={selectedBusiness || 'all'}
                                                onValueChange={(v) => handleBusinessFilter(v === 'all' ? '' : v)}
                                            >
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="Todos los negocios" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los negocios</SelectItem>
                                                    {Array.isArray(businesses) &&
                                                        businesses.map((b) => (
                                                            <SelectItem key={b.id} value={String(b.id)}>
                                                                {b.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Zonal</span>
                                        <Select
                                            value={selectedZonal || 'all'}
                                            onValueChange={(v) => handleZonalFilter(v === 'all' ? '' : v)}
                                            disabled={zonalDisabled}
                                        >
                                            <SelectTrigger className="h-10 w-full">
                                                <SelectValue
                                                    placeholder={
                                                        isVendor || selectedBusiness
                                                            ? 'Todos los zonales'
                                                            : 'Selecciona negocio'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {isVendor || selectedBusiness
                                                        ? 'Todos los zonales'
                                                        : 'Selecciona negocio'}
                                                </SelectItem>
                                                {filteredZonales.map((z) => (
                                                    <SelectItem key={z.id} value={String(z.id)}>
                                                        {z.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Circuito</span>
                                        <Select
                                            value={selectedCircuit || 'all'}
                                            onValueChange={(v) => handleCircuitFilter(v === 'all' ? '' : v)}
                                            disabled={circuitDisabled}
                                        >
                                            <SelectTrigger className="h-10 w-full">
                                                <SelectValue
                                                    placeholder={selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'}
                                                </SelectItem>
                                                {filteredCircuits.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name} - {c.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Ruta</span>
                                        <Select
                                            value={selectedRoute || 'all'}
                                            onValueChange={(v) => handleRouteFilter(v === 'all' ? '' : v)}
                                            disabled={routeDisabled}
                                        >
                                            <SelectTrigger className="h-10 w-full">
                                                <SelectValue
                                                    placeholder={
                                                        selectedCircuit
                                                            ? 'Todas las rutas'
                                                            : 'Selecciona circuito primero'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {selectedCircuit ? 'Todas las rutas' : 'Selecciona circuito primero'}
                                                </SelectItem>
                                                {filteredRoutes.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name} - {r.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Tipo de negocio</span>
                                        <Select
                                            value={businessTypeSelectValue}
                                            onValueChange={(v) => handleBusinessTypeFilter(v === 'all' ? '' : v)}
                                        >
                                            <SelectTrigger className="h-10 w-full">
                                                <SelectValue placeholder="Todos los tipos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos los tipos</SelectItem>
                                                {businessTypeOptions.map((bt) => (
                                                    <SelectItem key={bt.value} value={bt.value}>
                                                        {bt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {hasActiveFilters && (
                                        <div className="flex items-end">
                                            <Button
                                                variant="outline"
                                                onClick={clearFilters}
                                                className="h-10 w-full"
                                                title="Limpiar filtros"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Limpiar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                                        <span className="text-xs text-gray-500">Filtros activos:</span>
                                        {!isVendor && selectedBusiness && (
                                            <Badge variant="outline" className="text-xs">
                                                Negocio
                                            </Badge>
                                        )}
                                        {selectedZonal && <Badge variant="outline" className="text-xs">Zonal</Badge>}
                                        {selectedCircuit && <Badge variant="outline" className="text-xs">Circuito</Badge>}
                                        {selectedRoute && <Badge variant="outline" className="text-xs">Ruta</Badge>}
                                        {selectedBusinessType && (
                                            <Badge variant="outline" className="text-xs">
                                                Tipo:{' '}
                                                {businessTypeOptions.find((b) => b.value === selectedBusinessType)
                                                    ?.label ?? selectedBusinessType}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {canViewMap && mapFiltersForView !== null && (
                        <Card className="flex min-h-0 flex-col overflow-hidden p-0 shadow-sm">
                            <TipoNegocioMapView
                                key={JSON.stringify(mapFiltersForView)}
                                mapFilters={mapFiltersForView}
                                enabled
                                embedded
                            />
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
