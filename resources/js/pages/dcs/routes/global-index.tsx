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
import { type BreadcrumbItem } from '@/types';
import {
    Search,
    X,
    Filter,
    Plus
} from 'lucide-react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    circuit_id: number;
    created_at: string;
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
    zonales: Zonal[];
    circuits: Circuit[];
    filters: {
        zonal_id?: string;
        circuit_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function GlobalRoutesIndex({ routes, zonales, circuits, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZonal, setSelectedZonal] = useState(filters.zonal_id || '');
    const [selectedCircuit, setSelectedCircuit] = useState(filters.circuit_id || '');

    // Debounce para búsqueda automática
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Estados para modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteModel | null>(null);
    const [toggleModalData, setToggleModalData] = useState<{ route: RouteModel } | null>(null);

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

    // Filtrar circuitos por zonal seleccionado
    const filteredCircuits = selectedZonal
        ? circuits.filter(circuit => circuit.zonal_id.toString() === selectedZonal)
        : circuits;

    // Búsqueda automática con debounce
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            router.get(route('dcs.routes.index'), {
                search: searchQuery || undefined,
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

    const handleSearch = (query: string) => {
        // Esta función ya no es necesaria, pero la mantendré por compatibilidad
        setSearchQuery(query);
    };

    const handleZonalFilter = (zonalId: string) => {
        setSelectedZonal(zonalId);
        // Limpiar el filtro de circuito si se cambia el zonal
        if (zonalId !== selectedZonal) {
            setSelectedCircuit('');
        }
        router.get(route('dcs.routes.index'), {
            search: searchQuery || undefined,
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
            zonal_id: selectedZonal || undefined,
            circuit_id: circuitId || undefined
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
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

    const hasActiveFilters = selectedZonal || selectedCircuit || searchQuery;

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
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span>{zonales.length} zonales</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>{circuits.length} circuitos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-ruta-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nueva Ruta
                                        </Button>
                                    </div>
                                )}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nombre, código o circuito..."
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

                            {/* Filtro por Zonal */}
                            <Select
                                value={selectedZonal || "all"}
                                onValueChange={(value) => handleZonalFilter(value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos los zonales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los zonales</SelectItem>
                                    {zonales.map((zonal) => (
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
                                        {filteredCircuits.map((circuit) => (
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
                                {selectedZonal && (
                                    <Badge variant="outline" className="text-xs">
                                        Zonal: {zonales.find(z => z.id.toString() === selectedZonal)?.name}
                                    </Badge>
                                )}
                                {selectedCircuit && (
                                    <Badge variant="outline" className="text-xs">
                                        Circuito: {circuits.find(c => c.id.toString() === selectedCircuit)?.name}
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
                        isGlobalView={true}
                    />

                    {/* Modales */}
                    <RouteForm
                        isOpen={isFormModalOpen}
                        onClose={closeFormModal}
                        route={editingRoute}
                        circuits={circuits}
                        zonales={zonales}
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
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-ruta-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
