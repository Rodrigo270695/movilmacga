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
import { PdvsTable } from '@/components/dcs/pdvs/pdvs-table';
import { PdvForm } from '@/components/dcs/pdvs/pdv-form';
import { ConfirmToggleModal } from '@/components/dcs/pdvs/confirm-toggle-modal';
import { type BreadcrumbItem } from '@/types';
import { Plus, Download, Search, X, Filter } from 'lucide-react';

interface PdvModel {
    id: number;
    point_name: string;
    pos_id?: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    client_name: string;
    phone: string;
    classification: string;
    status: string;
    sells_recharge: boolean;
    address: string;
    latitude: number;
    longitude: number;
    route_id: number;
    district_id: number;
    locality: string;
    created_at: string;
    updated_at: string;
    route?: {
        id: number;
        name: string;
        code: string;
        circuit?: {
            id: number;
            name: string;
            zonal?: {
                id: number;
                name: string;
            };
        };
    };
    district?: {
        id: number;
        name: string;
        provincia?: {
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

interface Route {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
}



interface Departamento {
    id: number;
    name: string;
    pais_id: number;
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id: number;
    business?: {
        id: number;
        name: string;
    };
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
    businesses: Business[];
    zonales: Zonal[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    circuits: Circuit[];
    allRoutes: Route[];
    routes: Route[];
    departamentos: Departamento[];
    filters: {
        search?: string;
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
        route_id?: string;
        status?: string;
        classification?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function GlobalPdvsIndex({ pdvs, businesses, zonales, allZonales, allCircuits, circuits, allRoutes, routes, departamentos, filters, flash }: Props) {
    const { addToast } = useToast();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = usePage().props as any;

    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBusiness, setSelectedBusiness] = useState(filters.business_id || '');
    const [selectedZonal, setSelectedZonal] = useState(filters.zonal_id || '');
    const [selectedCircuit, setSelectedCircuit] = useState(filters.circuit_id || '');
    const [selectedRoute, setSelectedRoute] = useState(filters.route_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedClassification, setSelectedClassification] = useState(filters.classification || '');

    // Debounce para búsqueda automática
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Estados para modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPdv, setEditingPdv] = useState<PdvModel | null>(null);
    const [toggleModalData, setToggleModalData] = useState<{ pdv: PdvModel } | null>(null);

    // Breadcrumbs dinámicos (memoizados para evitar re-renders)
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'DCS',
            href: '#',
        },
        {
            title: 'Gestor de PDVs',
            href: '/dcs/pdvs',
        },
    ], []);

    // Opciones de estado (memoizadas para evitar re-renders)
    const statusOptions = useMemo(() => [
        { value: 'vende', label: 'Vende' },
        { value: 'no vende', label: 'No Vende' },
        { value: 'no existe', label: 'No Existe' },
        { value: 'pdv autoactivado', label: 'PDV Autoactivado' },
        { value: 'pdv impulsador', label: 'PDV Impulsador' },
    ], []);

    // Opciones de clasificación (memoizadas para evitar re-renders)
    const classificationOptions = useMemo(() => [
        { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
        { value: 'chalequeros', label: 'Chalequeros' },
        { value: 'bodega', label: 'Bodega' },
        { value: 'otras tiendas', label: 'Otras Tiendas' },
        { value: 'desconocida', label: 'Desconocida' },
        { value: 'pusher', label: 'Pusher' },
        { value: 'minimarket', label: 'Minimarket' },
        { value: 'botica', label: 'Bótica' },
        { value: 'farmacia', label: 'Farmacia' },
        { value: 'tambo', label: 'Tambo' },
        { value: 'cencosud', label: 'Cencosud' }
    ], []);

    // Filtrar zonales por negocio seleccionado
    const filteredZonales = selectedBusiness && Array.isArray(allZonales)
        ? allZonales.filter(zonal => zonal.business_id?.toString() === selectedBusiness)
        : (Array.isArray(allZonales) ? allZonales : []);

    // Filtrar circuitos por zonal seleccionado
    const filteredCircuits = selectedZonal && Array.isArray(allCircuits)
        ? allCircuits.filter(circuit => circuit.zonal_id?.toString() === selectedZonal)
        : (Array.isArray(allCircuits) ? allCircuits : []);

    // Filtrar rutas por circuito seleccionado
    const filteredRoutes = selectedCircuit && Array.isArray(allRoutes)
        ? allRoutes.filter(route => route.circuit_id?.toString() === selectedCircuit)
        : (Array.isArray(allRoutes) ? allRoutes : []);

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
    }, [flash?.success, flash?.error, addToast]);

    // Búsqueda automática con debounce
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            router.get(route('dcs.pdvs.index'), {
                search: searchQuery || undefined,
                business_id: selectedBusiness || undefined,
                zonal_id: selectedZonal || undefined,
                circuit_id: selectedCircuit || undefined,
                route_id: selectedRoute || undefined,
                status: selectedStatus || undefined,
                classification: selectedClassification || undefined
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
    }, [searchQuery, selectedBusiness, selectedZonal, selectedCircuit, selectedRoute, selectedStatus, selectedClassification]);

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
                setSelectedRoute('');
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
                setSelectedRoute('');
            }
        }
    }, [selectedZonal, allCircuits, selectedCircuit]);

    // Limpiar filtro de ruta cuando cambie el circuito
    useEffect(() => {
        if (selectedCircuit && selectedRoute && Array.isArray(allRoutes)) {
            // Verificar si la ruta seleccionada pertenece al nuevo circuito
            const routeBelongsToCircuit = allRoutes.some(route =>
                route.id.toString() === selectedRoute &&
                route.circuit_id.toString() === selectedCircuit
            );

            if (!routeBelongsToCircuit) {
                setSelectedRoute('');
            }
        }
    }, [selectedCircuit, allRoutes, selectedRoute]);

    // Limpieza del debounce al desmontar el componente
    useEffect(() => {
        return () => {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }
        };
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleBusinessFilter = (businessId: string) => {
        setSelectedBusiness(businessId);
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: businessId || undefined,
            zonal_id: undefined, // Reset zonal filter
            circuit_id: undefined, // Reset circuit filter
            route_id: undefined // Reset route filter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleZonalFilter = (zonalId: string) => {
        setSelectedZonal(zonalId);
        // Limpiar el filtro de circuito y ruta si se cambia el zonal
        if (zonalId !== selectedZonal) {
            setSelectedCircuit('');
            setSelectedRoute('');
        }
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: zonalId || undefined,
            circuit_id: undefined, // Reset circuit filter
            route_id: undefined // Reset route filter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleCircuitFilter = (circuitId: string) => {
        setSelectedCircuit(circuitId);
        // Limpiar el filtro de ruta si se cambia el circuito
        if (circuitId !== selectedCircuit) {
            setSelectedRoute('');
        }
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: circuitId || undefined,
            route_id: undefined // Reset route filter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleRouteFilter = (routeId: string) => {
        setSelectedRoute(routeId);
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: routeId || undefined
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Función para cambiar de página
    const handlePageChange = (page: number) => {
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            status: selectedStatus || undefined,
            classification: selectedClassification || undefined,
            page: page.toString()
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Función para cambiar elementos por página
    const handlePerPageChange = (perPage: number) => {
        router.get(route('dcs.pdvs.index'), {
            search: searchQuery || undefined,
            business_id: selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            status: selectedStatus || undefined,
            classification: selectedClassification || undefined,
            per_page: perPage.toString(),
            page: '1'
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };



    const clearFilters = () => {
        setSearchQuery('');
        setSelectedBusiness('');
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.pdvs.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const openCreateModal = () => {
        if (!hasPermission('gestor-pdv-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear PDVs.',
                duration: 4000
            });
            return;
        }
        setEditingPdv(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (pdv: PdvModel) => {
        if (!hasPermission('gestor-pdv-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar PDVs.',
                duration: 4000
            });
            return;
        }
        setEditingPdv(pdv);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingPdv(null);
    };

    const openToggleModal = (pdv: PdvModel) => {
        setToggleModalData({ pdv });
    };

    const closeToggleModal = () => {
        setToggleModalData(null);
    };

    // Función para exportar a Excel
    const handleExportToExcel = () => {
        if (!hasPermission('gestor-pdv-ver')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para exportar PDVs.',
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
        if (selectedRoute?.trim()) params.set('route_id', selectedRoute);

        // Crear URL de exportación
        const exportUrl = `${route('dcs.pdvs.export')}?${params.toString()}`;

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

    const hasActiveFilters = selectedBusiness || selectedZonal || selectedCircuit || selectedRoute || searchQuery;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestor de PDVs" />

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
                                            Gestor de PDVs
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                            Vista global de todos los puntos de venta del sistema
                                        </p>

                                        {/* Stats - Responsive */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>{pdvs.total} PDVs</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>{pdvs.data.filter(p => p.status === 'vende').length} vendiendo</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>{Array.isArray(businesses) ? businesses.length : 0} negocios</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>{Array.isArray(allZonales) ? allZonales.length : 0} zonales</span>
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
                                        className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 px-4 py-2 text-sm font-medium cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar Excel
                                    </Button>

                                    {/* Botón de crear */}
                                    {hasPermission('gestor-pdv-crear') && (
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo PDV
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
                                {/* Búsqueda */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre, ID post, DNI, cliente, estado, clasificación..."
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

                                {/* Filtros Jerárquicos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {/* Filtro por Negocio */}
                                    <Select
                                        value={selectedBusiness || "all"}
                                        onValueChange={(value) => handleBusinessFilter(value === "all" ? "" : value)}
                                    >
                                        <SelectTrigger className="w-full h-10">
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
                                        <SelectTrigger className="w-full h-10">
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
                                    <Select
                                        value={selectedCircuit || "all"}
                                        onValueChange={(value) => handleCircuitFilter(value === "all" ? "" : value)}
                                        disabled={!selectedZonal}
                                    >
                                        <SelectTrigger className="w-full h-10">
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

                                    {/* Filtro por Ruta */}
                                    <Select
                                        value={selectedRoute || "all"}
                                        onValueChange={(value) => handleRouteFilter(value === "all" ? "" : value)}
                                        disabled={!selectedCircuit}
                                    >
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue
                                                placeholder={selectedCircuit ? 'Todas las rutas' : 'Selecciona un circuito primero'}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {selectedCircuit ? 'Todas las rutas' : 'Selecciona un circuito primero'}
                                            </SelectItem>
                                            {Array.isArray(filteredRoutes) && filteredRoutes.map((route) => (
                                                <SelectItem key={route.id} value={route.id.toString()}>
                                                    {route.name} - {route.code}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Botón limpiar filtros */}
                                    {hasActiveFilters && (
                                        <div className="flex items-center">
                                            <Button
                                                variant="outline"
                                                onClick={clearFilters}
                                                className="w-full h-10"
                                                title="Limpiar filtros"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Limpiar
                                            </Button>
                                        </div>
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
                                    {selectedRoute && (
                                        <Badge variant="outline" className="text-xs">
                                            Ruta: {Array.isArray(allRoutes) ? allRoutes.find(r => r.id.toString() === selectedRoute)?.name : ''}
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

                    {/* Tabla de PDVs */}
                    <PdvsTable
                        pdvs={pdvs}
                        onEdit={openEditModal}
                        onToggleStatus={openToggleModal}
                        isGlobalView={true}
                    />

                    {/* Paginación */}
                    {pdvs.last_page > 1 && (
                        <Pagination
                            data={pdvs}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}

                    {/* Modales */}
                    <PdvForm
                        open={isFormModalOpen}
                        onClose={closeFormModal}
                        pdv={editingPdv}
                        zonales={allZonales}
                        circuits={allCircuits}
                        departamentos={departamentos}
                    />

                    {/* Modal de Confirmación de Estado */}
                    {toggleModalData && (
                        <ConfirmToggleModal
                            open={true}
                            onClose={closeToggleModal}
                            pdv={toggleModalData.pdv}
                            isGlobalView={true}
                        />
                    )}
                </div>

                {/* Botones flotantes - Solo móviles */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden flex flex-col gap-3">
                    {/* Botón de exportación */}
                    <Button
                        onClick={handleExportToExcel}
                        size="lg"
                        className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Exportar Excel"
                    >
                        <Download className="w-5 h-5" />
                    </Button>

                    {/* Botón de crear */}
                    {hasPermission('gestor-pdv-crear') && (
                        <Button
                            onClick={openCreateModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
