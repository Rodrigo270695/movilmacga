import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { CircuitsTable } from '@/components/dcs/circuits/circuits-table';
import { CircuitForm } from '@/components/dcs/circuits/circuit-form';
import { ConfirmToggleModal } from '@/components/dcs/circuits/confirm-toggle-modal';
import { FrequencyModal } from '@/components/dcs/circuits/frequency-modal';
import {
    Search,
    X,
    Filter,
    Plus
} from 'lucide-react';

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal_id: number;
    created_at: string;
    routes_count?: number;
    frequency_days?: string[];
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
    circuits: {
        data: Circuit[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    zonales: Zonal[];
    businessScope: {
        is_admin: boolean;
        business_id?: number;
        business_ids: number[];
        zonal_ids: number[];
        has_business_restriction: boolean;
        has_zonal_restriction: boolean;
    };
    filters: {
        search?: string;
        zonal_id?: string;
    };
}

interface PageProps {
    [key: string]: unknown;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function GlobalCircuitsIndex({ circuits, zonales, businessScope, filters }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage<PageProps>().props;
    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZonal, setSelectedZonal] = useState(filters.zonal_id || '');

    // Debounce para búsqueda automática
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Estados para modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
    const [toggleModalData, setToggleModalData] = useState<{ circuit: Circuit } | null>(null);
    const [frequencyModalData, setFrequencyModalData] = useState<{ circuit: Circuit } | null>(null);

    const breadcrumbItems = [
        { title: 'DCS', href: '/dcs' },
        { title: 'Gestor de Circuitos', href: '' }
    ];

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Búsqueda automática con debounce
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            router.get(route('dcs.circuits.index'), {
                search: searchQuery || undefined,
                zonal_id: selectedZonal || undefined
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

    const handleZonalFilter = (zonalId: string) => {
        setSelectedZonal(zonalId);
        router.get(route('dcs.circuits.index'), {
            search: searchQuery || undefined,
            zonal_id: zonalId || undefined
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedZonal('');
        router.get(route('dcs.circuits.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const openCreateModal = () => {
        if (!hasPermission('gestor-circuito-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear circuitos.',
                duration: 4000
            });
            return;
        }
        setEditingCircuit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (circuit: Circuit) => {
        setEditingCircuit(circuit);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingCircuit(null);
    };

    const openToggleModal = (circuit: Circuit) => {
        setToggleModalData({ circuit });
    };

    const closeToggleModal = () => {
        setToggleModalData(null);
    };

    const openFrequencyModal = (circuit: Circuit) => {
        setFrequencyModalData({ circuit });
    };

    const closeFrequencyModal = () => {
        setFrequencyModalData(null);
    };

    const hasActiveFilters = selectedZonal || searchQuery;

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Gestor de Circuitos" />

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
                                            Gestor de Circuitos
                                        </h1>
                                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Vista global de todos los circuitos del sistema
                                    {businessScope.has_business_restriction && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {businessScope.business_id ? 'Negocio específico' : `${businessScope.business_ids.length} negocios`}
                                        </span>
                                    )}
                                    {businessScope.has_zonal_restriction && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Supervisor: {businessScope.zonal_ids.length} zonales
                                        </span>
                                    )}
                                </p>

                                        {/* Stats - Responsive */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>{circuits.total} circuitos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>{circuits.data.filter(c => c.status === true || c.status === 1).length} activos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span>{zonales.length} zonales</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>{circuits.data.reduce((total, c) => total + (c.routes_count || 0), 0)} rutas</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-circuito-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Circuito
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Búsqueda */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre, código o zonal..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>

                                {/* Filtro por Zonal */}
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedZonal || "all"}
                                        onValueChange={(value) => handleZonalFilter(value === "all" ? "" : value)}
                                    >
                                        <SelectTrigger className="flex-1">
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

                                    {/* Botón limpiar filtros */}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="flex-shrink-0 cursor-pointer"
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
                                    {searchQuery && (
                                        <Badge variant="outline" className="text-xs">
                                            Búsqueda: "{searchQuery}"
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Tabla de Circuitos */}
                    <CircuitsTable
                        circuits={circuits}
                        onEdit={openEditModal}
                        onToggleStatus={openToggleModal}
                        onFrequency={openFrequencyModal}
                        userPermissions={userPermissions}
                        isGlobalView={true}
                    />

                    {/* Modal de Formulario */}
                    <CircuitForm
                        isOpen={isFormModalOpen}
                        onClose={closeFormModal}
                        circuit={editingCircuit}
                        zonales={zonales}
                        isGlobalView={true}
                    />

                    {/* Modal de Confirmación de Estado */}
                    {toggleModalData && (
                        <ConfirmToggleModal
                            isOpen={true}
                            onClose={closeToggleModal}
                            circuit={toggleModalData.circuit}
                            zonal={zonales.find(z => z.id === toggleModalData.circuit.zonal_id) || zonales[0]}
                            isGlobalView={true}
                        />
                    )}

                    {/* Modal de Frecuencia */}
                    {frequencyModalData && (
                        <FrequencyModal
                            isOpen={true}
                            onClose={closeFrequencyModal}
                            circuit={frequencyModalData.circuit}
                        />
                    )}

                    {/* Botón flotante - Solo móviles */}
                    {hasPermission('gestor-circuito-crear') && (
                        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                            <Button
                                onClick={openCreateModal}
                                size="lg"
                                className="h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                            >
                                <Plus className="w-6 h-6" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
