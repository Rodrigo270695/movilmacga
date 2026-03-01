import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { PdvOperatorsTable } from '@/components/dcs/pdv-operators/pdv-operators-table';
import { PdvOperatorsMobileCards } from '@/components/dcs/pdv-operators/pdv-operators-mobile-cards';
import { type BreadcrumbItem } from '@/types';
import { Download, Search, X, Filter, Save, Map } from 'lucide-react';
import { PdvOperatorsMapModal } from '@/components/dcs/pdv-operators/pdv-operators-map-modal';

interface PdvModel {
    id: number;
    point_name: string;
    client_name: string;
    route?: { circuit?: { name: string; zonal?: { name: string } } };
    operators?: { id: number; pivot?: { status: boolean } }[];
}

interface Operator {
    id: number;
    name: string;
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
    zonal?: { business_id?: number };
}

interface Route {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
    circuit?: { zonal_id?: number; zonal?: { business_id?: number } };
}

interface Props {
    pdvs: {
        data: PdvModel[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    operators: Operator[];
    businesses: Business[];
    zonales: Zonal[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    circuits: Circuit[];
    allRoutes: Route[];
    routes: Route[];
    filters: {
        search?: string;
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
        route_id?: string;
        status?: string;
        classification?: string;
    };
    flash?: { success?: string; error?: string };
}

export default function PdvOperatorsGlobalIndex({
    pdvs,
    operators,
    businesses,
    zonales,
    allZonales,
    allCircuits,
    circuits,
    allRoutes,
    routes,
    filters,
    flash,
}: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBusiness, setSelectedBusiness] = useState(filters.business_id || '');
    const [selectedZonal, setSelectedZonal] = useState(filters.zonal_id || '');
    const [selectedCircuit, setSelectedCircuit] = useState(filters.circuit_id || '');
    const [selectedRoute, setSelectedRoute] = useState(filters.route_id || '');
    const [assignments, setAssignments] = useState<Record<string, Record<string, boolean>>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'DCS', href: '#' },
            { title: 'PDV - Operadores', href: '/dcs/pdv-operators' },
        ],
        []
    );

    const hasPermission = (p: string) => userPermissions.includes(p);
    const canEdit = hasPermission('gestor-pdv-operadores-editar');

    const filteredZonales = useMemo(
        () =>
            selectedBusiness && Array.isArray(allZonales)
                ? allZonales.filter((z) => z.business_id?.toString() === selectedBusiness)
                : Array.isArray(allZonales) ? allZonales : [],
        [selectedBusiness, allZonales]
    );
    const filteredCircuits = useMemo(
        () =>
            selectedZonal && Array.isArray(allCircuits)
                ? allCircuits.filter((c) => c.zonal_id?.toString() === selectedZonal)
                : Array.isArray(allCircuits) ? allCircuits : [],
        [selectedZonal, allCircuits]
    );
    const filteredRoutes = useMemo(
        () =>
            selectedCircuit && Array.isArray(allRoutes)
                ? allRoutes.filter((r) => r.circuit_id?.toString() === selectedCircuit)
                : Array.isArray(allRoutes) ? allRoutes : [],
        [selectedCircuit, allRoutes]
    );

    // Build assignments from pdvs when data changes
    useEffect(() => {
        const next: Record<string, Record<string, boolean>> = {};
        pdvs.data.forEach((pdv) => {
            next[pdv.id] = {};
            operators.forEach((op) => {
                const pivot = pdv.operators?.find((o) => o.id === op.id)?.pivot;
                const isMovistar = String(op.name).toLowerCase() === 'movistar';
                next[pdv.id][op.id] = isMovistar ? (pivot?.status ?? true) : (pivot?.status ?? false);
            });
        });
        setAssignments(next);
        setHasChanges(false);
    }, [pdvs.data, operators]);

    useEffect(() => {
        if (flash?.success) addToast({ type: 'success', title: 'Éxito', message: flash.success, duration: 4000 });
        if (flash?.error) addToast({ type: 'error', title: 'Error', message: flash.error, duration: 5000 });
    }, [flash?.success, flash?.error, addToast]);

    useEffect(() => {
        if (searchDebounce) clearTimeout(searchDebounce);
        const t = setTimeout(
            () =>
                router.get(route('dcs.pdv-operators.index'), {
                    search: searchQuery || undefined,
                    business_id: selectedBusiness || undefined,
                    zonal_id: selectedZonal || undefined,
                    circuit_id: selectedCircuit || undefined,
                    route_id: selectedRoute || undefined,
                    page: 1,
                }, { preserveState: true, preserveScroll: true, replace: true }),
            500
        );
        setSearchDebounce(t);
        return () => clearTimeout(t);
    }, [searchQuery, selectedBusiness, selectedZonal, selectedCircuit, selectedRoute]);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const handleBusinessFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedBusiness(val);
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: val || undefined,
            zonal_id: undefined,
            circuit_id: undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleZonalFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedZonal(val);
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: val || undefined,
            circuit_id: undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCircuitFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedCircuit(val);
        setSelectedRoute('');
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: val || undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleRouteFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedRoute(val);
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: val || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleAssignmentChange = (pdvId: number, operatorId: number, checked: boolean) => {
        setAssignments((prev) => ({
            ...prev,
            [pdvId]: { ...(prev[pdvId] || {}), [operatorId]: checked },
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        if (!canEdit || !hasChanges) return;
        const list: { pdv_id: number; operator_id: number; status: boolean }[] = [];
        pdvs.data.forEach((pdv) => {
            operators.forEach((op) => {
                list.push({
                    pdv_id: pdv.id,
                    operator_id: op.id,
                    status: !!assignments[pdv.id]?.[op.id],
                });
            });
        });
        setSaving(true);
        router.post(route('dcs.pdv-operators.sync'), { assignments: list }, {
            preserveScroll: true,
            onSuccess: () => setHasChanges(false),
            onError: () => addToast({ type: 'error', title: 'Error', message: 'No se pudieron guardar las asignaciones.', duration: 4000 }),
            onFinish: () => setSaving(false),
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            page: page.toString(),
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('dcs.pdv-operators.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            per_page: perPage.toString(),
            page: '1',
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedBusiness('');
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.pdv-operators.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleExportToExcel = () => {
        if (!hasPermission('gestor-pdv-operadores-exportar')) {
            addToast({ type: 'error', title: 'Sin permisos', message: 'No tienes permisos para exportar.', duration: 4000 });
            return;
        }
        const params = new URLSearchParams();
        if (searchQuery?.trim()) params.set('search', searchQuery);
        if (selectedBusiness?.trim()) params.set('business_id', selectedBusiness);
        if (selectedZonal?.trim()) params.set('zonal_id', selectedZonal);
        if (selectedCircuit?.trim()) params.set('circuit_id', selectedCircuit);
        if (selectedRoute?.trim()) params.set('route_id', selectedRoute);
        const url = `${route('dcs.pdv-operators.export')}?${params.toString()}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast({ type: 'success', title: 'Exportación', message: 'Archivo descargado.', duration: 4000 });
    };

    const hasActiveFilters = !!(selectedBusiness || selectedZonal || selectedCircuit || selectedRoute || searchQuery);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PDV - Operadores" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        PDV - Operadores
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Asignar operadores a cada PDV (Si/No). Los filtros respetan tu negocio y zonal.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <span>{pdvs.total} PDVs</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                            <span>{operators.length} operadores</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    {hasPermission('gestor-pdv-operadores-ver-mapa') && (
                                        <Button
                                            onClick={() => setIsMapModalOpen(true)}
                                            variant="outline"
                                            className="border-pink-600 text-pink-600 hover:bg-pink-50 hover:border-pink-700 hover:text-pink-700 px-4 py-2 text-sm font-medium cursor-pointer"
                                            title="Ver mapa"
                                        >
                                            <Map className="w-4 h-4 mr-2" />
                                            Mapa
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleExportToExcel}
                                        variant="outline"
                                        className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 px-4 py-2 text-sm font-medium cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar Excel
                                    </Button>
                                    {canEdit && (
                                        <Button
                                            onClick={handleSave}
                                            disabled={!hasChanges || saving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Guardando...
                                                </span>
                                            ) : hasChanges ? (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Actualizar
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Guardar
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filtros</span>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre, cliente..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    {searchQuery && (
                                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                                    <Select value={selectedBusiness || 'all'} onValueChange={(v) => handleBusinessFilter(v === 'all' ? '' : v)}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Todos los negocios" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los negocios</SelectItem>
                                            {Array.isArray(businesses) && businesses.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedZonal || 'all'} onValueChange={(v) => handleZonalFilter(v === 'all' ? '' : v)} disabled={!selectedBusiness}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder={selectedBusiness ? 'Todos los zonales' : 'Selecciona negocio'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{selectedBusiness ? 'Todos los zonales' : 'Selecciona negocio'}</SelectItem>
                                            {filteredZonales.map((z) => (
                                                <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedCircuit || 'all'} onValueChange={(v) => handleCircuitFilter(v === 'all' ? '' : v)} disabled={!selectedZonal}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder={selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'}</SelectItem>
                                            {filteredCircuits.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name} - {c.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedRoute || 'all'} onValueChange={(v) => handleRouteFilter(v === 'all' ? '' : v)} disabled={!selectedCircuit}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder={selectedCircuit ? 'Todas las rutas' : 'Selecciona circuito'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{selectedCircuit ? 'Todas las rutas' : 'Selecciona circuito'}</SelectItem>
                                            {filteredRoutes.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>{r.name} - {r.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={clearFilters} className="w-full h-10" title="Limpiar filtros">
                                            <X className="w-4 h-4 mr-2" />
                                            Limpiar
                                        </Button>
                                    )}
                                </div>
                                {hasActiveFilters && (
                                    <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                                        <span className="text-xs text-gray-500">Filtros activos:</span>
                                        {selectedBusiness && <Badge variant="outline" className="text-xs">Negocio</Badge>}
                                        {selectedZonal && <Badge variant="outline" className="text-xs">Zonal</Badge>}
                                        {selectedCircuit && <Badge variant="outline" className="text-xs">Circuito</Badge>}
                                        {selectedRoute && <Badge variant="outline" className="text-xs">Ruta</Badge>}
                                        {searchQuery && <Badge variant="outline" className="text-xs">Búsqueda</Badge>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Tabla - Desktop */}
                    {!isMobile && (
                        <PdvOperatorsTable
                            pdvs={pdvs}
                            operators={operators}
                            assignments={assignments}
                            onAssignmentChange={handleAssignmentChange}
                            canEdit={canEdit}
                        />
                    )}
                    {/* Cards - Móvil */}
                    {isMobile && (
                        <PdvOperatorsMobileCards
                            pdvs={pdvs}
                            operators={operators}
                            assignments={assignments}
                            onAssignmentChange={handleAssignmentChange}
                            canEdit={canEdit}
                        />
                    )}

                    {pdvs.last_page > 1 && (
                        <Pagination data={pdvs} onPageChange={handlePageChange} onPerPageChange={handlePerPageChange} />
                    )}

                    {/* Modal mapa */}
                    <PdvOperatorsMapModal
                        isOpen={isMapModalOpen}
                        onClose={() => setIsMapModalOpen(false)}
                        mapFilters={{
                            search: searchQuery || undefined,
                            business_id: selectedBusiness || undefined,
                            zonal_id: selectedZonal || undefined,
                            circuit_id: selectedCircuit || undefined,
                            route_id: selectedRoute || undefined,
                        }}
                    />

                    {/* Móvil: botones flotantes Mapa + Exportar + Guardar */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden flex flex-col gap-3">
                    {hasPermission('gestor-pdv-operadores-ver-mapa') && (
                        <Button
                            onClick={() => setIsMapModalOpen(true)}
                            size="lg"
                            className="h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg cursor-pointer"
                            title="Ver mapa"
                        >
                            <Map className="w-5 h-5" />
                        </Button>
                    )}
                    {hasPermission('gestor-pdv-operadores-exportar') && (
                        <Button
                            onClick={handleExportToExcel}
                            size="lg"
                            className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg cursor-pointer"
                            title="Exportar Excel"
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                    )}
                    {canEdit && (
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50 cursor-pointer"
                            title={hasChanges ? 'Actualizar' : 'Guardar'}
                        >
                            <Save className="w-6 h-6" />
                        </Button>
                    )}
                </div>
                </div>
            </div>
        </AppLayout>
    );
}
