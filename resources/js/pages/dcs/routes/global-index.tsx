import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { RoutesTable } from '@/components/dcs/routes/routes-table';
import { RouteForm } from '@/components/dcs/routes/route-form';
import { ConfirmToggleModal } from '@/components/dcs/routes/confirm-toggle-modal';
import { VisitDatesModal } from '@/components/dcs/routes/visit-dates-modal';
import { RouteMapModal } from '@/components/dcs/routes/route-map-modal';
import { type BreadcrumbItem } from '@/types';
import {
    Search,
    X,
    Filter,
    Plus,
    Download
} from 'lucide-react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    circuit_id: number;
    created_at: string;
    pdvs_count?: number; // Conteo total de PDVs
    active_pdvs_count?: number; // Conteo de PDVs activos (vende)
    thisWeekVisits?: Array<{
        visit_date: string;
    }>; // Fechas de visita de esta semana
    circuit?: {
        id: number;
        name: string;
        zonal?: {
            id: number;
            name: string;
        };
    };
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Zonal {
    id: number;
    name: string;
}

interface Business {
    id: number;
    name: string;
}

interface Props {
    routes: {
        data: RouteModel[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    businesses: Business[];
    zonales: Zonal[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    circuits: Circuit[];
    filters: {
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function GlobalRoutesIndex({ routes, businesses, zonales, allZonales, allCircuits, circuits, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState(filters.business_id || '');
    const [selectedZonal, setSelectedZonal] = useState(filters.zonal_id || '');
    const [selectedCircuit, setSelectedCircuit] = useState(filters.circuit_id || '');

    // Debounce para búsqueda automática
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Estados para modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteModel | null>(null);
    const [toggleModalData, setToggleModalData] = useState<{ route: RouteModel } | null>(null);
    const [isVisitDatesModalOpen, setIsVisitDatesModalOpen] = useState(false);
    const [selectedRouteForDates, setSelectedRouteForDates] = useState<RouteModel | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedRouteForMap, setSelectedRouteForMap] = useState<RouteModel | null>(null);

    // Breadcrumbs dinámicos
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'DCS',
            href: '#',
        },
        {
            title: 'Gestor de Rutas',
            href: '/dcs/routes',
        },
    ];

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

    // Filtrar zonales por negocio seleccionado
    const filteredZonales = selectedBusiness && Array.isArray(allZonales)
        ? allZonales.filter(zonal => zonal.business_id?.toString() === selectedBusiness)
        : (Array.isArray(allZonales) ? allZonales : []);

    // Filtrar circuitos por zonal seleccionado
    const filteredCircuits = selectedZonal && Array.isArray(allCircuits)
        ? allCircuits.filter(circuit => circuit.zonal_id?.toString() === selectedZonal)
        : (Array.isArray(allCircuits) ? allCircuits : []);

    // Búsqueda automática con debounce
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            router.get(route('dcs.routes.index'), {
                search: searchQuery || undefined,
                business_id: selectedBusiness || undefined,
                zonal_id: selectedZonal || undefined,
                circuit_id: selectedCircuit || undefined
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 500); // 500ms de delay

        setSearchDebounce(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [searchQuery]); // Solo cuando cambie searchQuery

    // Limpiar filtros cuando cambie el negocio
    useEffect(() => {
        if (selectedBusiness && selectedZonal) {
            // Verificar si el zonal seleccionado pertenece al nuevo negocio
            const zonalBelongsToBusiness = Array.isArray(allZonales) &&
                allZonales.some(zonal =>
                    zonal.id.toString() === selectedZonal &&
                    zonal.business_id?.toString() === selectedBusiness
                );

            if (!zonalBelongsToBusiness) {
                setSelectedZonal('');
                setSelectedCircuit('');
            }
        }
    }, [selectedBusiness, allZonales, selectedZonal]);

    // Limpiar filtro de circuito cuando cambie el zonal
    useEffect(() => {
        if (selectedZonal && selectedCircuit && Array.isArray(allCircuits)) {
            // Verificar si el circuito seleccionado pertenece al nuevo zonal
            const circuitBelongsToZonal = allCircuits.some(circuit =>
                circuit.id.toString() === selectedCircuit &&
                circuit.zonal_id.toString() === selectedZonal
            );

            if (!circuitBelongsToZonal) {
                setSelectedCircuit('');
            }
        }
    }, [selectedZonal, allCircuits, selectedCircuit]);

    const handleSearch = (query: string) => {
        // Esta función ya no es necesaria, pero la mantendré por compatibilidad
        setSearchQuery(query);
    };

    const handleBusinessFilter = (businessId: string) => {
        setSelectedBusiness(businessId);
        router.get(route('dcs.routes.index'), {
            search: searchQuery || undefined,
            business_id: businessId || undefined,
            zonal_id: undefined, // Reset zonal filter
            circuit_id: undefined // Reset circuit filter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleZonalFilter = (zonalId: string) => {
        setSelectedZonal(zonalId);
        // Limpiar el filtro de circuito si se cambia el zonal
        if (zonalId !== selectedZonal) {
            setSelectedCircuit('');
        }
        router.get(route('dcs.routes.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: zonalId || undefined,
            circuit_id: undefined // Reset circuit filter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleCircuitFilter = (circuitId: string) => {
        setSelectedCircuit(circuitId);
        router.get(route('dcs.routes.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: circuitId || undefined
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedBusiness('');
        setSelectedZonal('');
        setSelectedCircuit('');
        router.get(route('dcs.routes.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const openCreateModal = () => {
        if (!hasPermission('gestor-ruta-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear rutas.',
                duration: 4000
            });
            return;
        }
        setEditingRoute(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (route: RouteModel) => {
        if (!hasPermission('gestor-ruta-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar rutas.',
                duration: 4000
            });
            return;
        }
        setEditingRoute(route);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingRoute(null);
    };

    const openToggleModal = (route: RouteModel) => {
        setToggleModalData({ route });
    };

    const closeToggleModal = () => {
        setToggleModalData(null);
    };

    const openVisitDatesModal = (route: RouteModel) => {
        if (!hasPermission('gestor-ruta-fechas-visita')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para gestionar fechas de visita.',
                duration: 4000
            });
            return;
        }
        setSelectedRouteForDates(route);
        setIsVisitDatesModalOpen(true);
    };

    const closeVisitDatesModal = () => {
        setIsVisitDatesModalOpen(false);
        setSelectedRouteForDates(null);
        // Limpiar todos los datos del modal cuando se cierre
        // Los datos se limpiarán automáticamente cuando el modal se desmonte
    };

    const openMapModal = (route: RouteModel) => {
        if (!hasPermission('gestor-ruta-ver')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para ver el mapa de la ruta.',
                duration: 4000
            });
            return;
        }
        setSelectedRouteForMap(route);
        setIsMapModalOpen(true);
    };

    const closeMapModal = () => {
        setIsMapModalOpen(false);
        setSelectedRouteForMap(null);
    };

    // Función para exportar a Excel
    const handleExportToExcel = () => {
        if (!hasPermission('gestor-ruta-ver')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para exportar rutas.',
                duration: 4000
            });
            return;
        }

        // Construir URL con todos los filtros aplicados
        const params = new URLSearchParams();

        // Filtros jerárquicos
        if (searchQuery?.trim()) params.set('search', searchQuery);
        if (selectedBusiness?.trim()) params.set('business_id', selectedBusiness);
        if (selectedZonal?.trim()) params.set('zonal_id', selectedZonal);
        if (selectedCircuit?.trim()) params.set('circuit_id', selectedCircuit);

        // Crear URL de exportación
        const exportUrl = `${route('dcs.routes.export')}?${params.toString()}`;

        // Mostrar toast de inicio
        addToast({
            type: 'info',
            title: 'Exportando...',
            message: 'Preparando archivo Excel con los filtros aplicados.',
            duration: 3000
        });

        // Descargar archivo
        const link = document.createElement('a');
        link.href = exportUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Mostrar toast de éxito
        setTimeout(() => {
            addToast({
                type: 'success',
                title: '¡Exportación completada!',
                message: 'El archivo Excel se ha descargado correctamente.',
                duration: 4000
            });
        }, 1000);
    };



    const hasActiveFilters = selectedBusiness || selectedZonal || selectedCircuit || searchQuery;

        return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestor de Rutas" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">

                                {/* Título */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                            Gestor de Rutas
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                            Vista global de todas las rutas del sistema
                                        </p>

                                        {/* Stats - Responsive */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>{routes.total} rutas</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>{routes.data.filter(r => r.status === true || r.status === 1).length} activas</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                <span>{routes.data.reduce((total, route) => total + (route.active_pdvs_count || 0), 0)} PDVs activos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>{Array.isArray(businesses) ? businesses.length : 0} negocios</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span>{Array.isArray(zonales) ? zonales.length : 0} zonales</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>{circuits.length} circuitos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones desktop - Solo mostrar en pantallas grandes */}
                                <div className="hidden sm:flex items-center gap-3">
                                    {/* Botón de exportación */}
                                    <Button
                                        onClick={handleExportToExcel}
                                        variant="outline"
                                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-700 hover:text-emerald-700 px-4 py-2 text-sm font-medium cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar Excel
                                    </Button>

                                    {/* Botón de crear */}
                                    {hasPermission('gestor-ruta-crear') && (
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nueva Ruta
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <Input
                                        placeholder="Buscar por nombre, código o estado..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>

                            {/* Filtro por Negocio */}
                            <Select
                                value={selectedBusiness || "all"}
                                onValueChange={(value) => handleBusinessFilter(value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos los negocios" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los negocios</SelectItem>
                                    {Array.isArray(businesses) && businesses.map((business) => (
                                        <SelectItem key={business.id} value={business.id.toString()}>
                                            {business.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filtro por Zonal */}
                            <Select
                                value={selectedZonal || "all"}
                                onValueChange={(value) => handleZonalFilter(value === "all" ? "" : value)}
                                disabled={!selectedBusiness}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={selectedBusiness ? 'Todos los zonales' : 'Selecciona un negocio primero'}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {selectedBusiness ? 'Todos los zonales' : 'Selecciona un negocio primero'}
                                    </SelectItem>
                                    {Array.isArray(filteredZonales) && filteredZonales.map((zonal) => (
                                        <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                            {zonal.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filtro por Circuito */}
                            <div className="flex gap-2">
                                <Select
                                    value={selectedCircuit || "all"}
                                    onValueChange={(value) => handleCircuitFilter(value === "all" ? "" : value)}
                                    disabled={!selectedZonal}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={selectedZonal ? 'Todos los circuitos' : 'Selecciona un zonal primero'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {selectedZonal ? 'Todos los circuitos' : 'Selecciona un zonal primero'}
                                        </SelectItem>
                                        {Array.isArray(filteredCircuits) && filteredCircuits.map((circuit) => (
                                            <SelectItem key={circuit.id} value={circuit.id.toString()}>
                                                {circuit.name} - {circuit.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Botón limpiar filtros */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="flex-shrink-0"
                                        title="Limpiar filtros"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Indicadores de filtros activos */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <span className="text-xs text-gray-500">Filtros activos:</span>
                                {selectedBusiness && (
                                    <Badge variant="outline" className="text-xs">
                                        Negocio: {Array.isArray(businesses) ? businesses.find(b => b.id.toString() === selectedBusiness)?.name : ''}
                                    </Badge>
                                )}
                                {selectedZonal && (
                                    <Badge variant="outline" className="text-xs">
                                        Zonal: {Array.isArray(allZonales) ? allZonales.find(z => z.id.toString() === selectedZonal)?.name : ''}
                                    </Badge>
                                )}
                                {selectedCircuit && (
                                    <Badge variant="outline" className="text-xs">
                                        Circuito: {Array.isArray(allCircuits) ? allCircuits.find(c => c.id.toString() === selectedCircuit)?.name : ''}
                                    </Badge>
                                )}
                                {searchQuery && (
                                    <Badge variant="outline" className="text-xs">
                                        Búsqueda: "{searchQuery}"
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                    {/* Tabla de Rutas */}
                    <RoutesTable
                        routes={routes}
                        onEdit={openEditModal}
                        onToggleStatus={openToggleModal}
                        onManageVisitDates={openVisitDatesModal}
                        onViewVisitDates={openVisitDatesModal}
                        onViewMap={openMapModal}
                        isGlobalView={true}
                    />

                    {/* Modales */}
                    <RouteForm
                        isOpen={isFormModalOpen}
                        onClose={closeFormModal}
                        route={editingRoute}
                        circuits={Array.isArray(allCircuits) ? allCircuits : []}
                        zonales={allZonales}
                        isGlobalView={true}
                    />

                    {/* Modal de Confirmación de Estado */}
                    {toggleModalData && (
                        <ConfirmToggleModal
                            isOpen={true}
                            onClose={closeToggleModal}
                            route={toggleModalData.route}
                            isGlobalView={true}
                        />
                    )}

                    {/* Modal de Fechas de Visita */}
                    <VisitDatesModal
                        isOpen={isVisitDatesModalOpen}
                        onClose={closeVisitDatesModal}
                        route={selectedRouteForDates}
                    />

                    {/* Modal del Mapa */}
                    <RouteMapModal
                        isOpen={isMapModalOpen}
                        onClose={closeMapModal}
                        route={selectedRouteForMap}
                    />
                </div>

                {/* Botones flotantes - Solo móviles */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden flex flex-col gap-3">
                    {/* Botón de exportación */}
                    <Button
                        onClick={handleExportToExcel}
                        size="lg"
                        className="h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Exportar Excel"
                    >
                        <Download className="w-5 h-5" />
                    </Button>

                    {/* Botón de crear */}
                    {hasPermission('gestor-ruta-crear') && (
                        <Button
                            onClick={openCreateModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
