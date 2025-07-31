import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Usando componente Select personalizado para evitar bucles infinitos de Radix UI
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomSelect } from '@/components/ui/custom-select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import AppLayout from '@/layouts/app-layout';
import { PdvsTable } from '@/components/dcs/pdvs/pdvs-table';
import { PdvForm } from '@/components/dcs/pdvs/pdv-form';
import { ConfirmToggleModal } from '@/components/dcs/pdvs/confirm-toggle-modal';
import { type BreadcrumbItem } from '@/types';
import {
    Search,
    X,
    Filter,
    Plus,
    ChevronDown,
    ChevronUp,
    Settings2,
    Tag
} from 'lucide-react';

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
    locality_id: number;
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
    locality?: {
        id: number;
        name: string;
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

interface Provincia {
    id: number;
    name: string;
    departamento_id: number;
}

interface Distrito {
    id: number;
    name: string;
    provincia_id: number;
}

interface Locality {
    id: number;
    name: string;
    distrito_id: number;
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
    circuits: Circuit[];
    routes: Route[];
    departamentos: Departamento[];
    // REMOVIDO: provincias, distritos, localities (se cargan dinámicamente)
    filters: {
        route_id?: string;
        status?: string;
        classification?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function GlobalPdvsIndex({ pdvs, circuits, routes, departamentos, filters, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;

    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(filters.route_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedClassification, setSelectedClassification] = useState(filters.classification || '');

    // Estados para filtros avanzados
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState(filters.document_type || '');
    const [sellsRecharge, setSellsRecharge] = useState(filters.sells_recharge || '');
    const [selectedCircuit, setSelectedCircuit] = useState(filters.circuit_id || '');
    const [documentNumber, setDocumentNumber] = useState(filters.document_number || '');
    const [clientName, setClientName] = useState(filters.client_name || '');
    const [pointName, setPointName] = useState(filters.point_name || '');
    const [posId, setPosId] = useState(filters.pos_id || '');

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
        { value: 'pdv impulsador', label: 'PDV Impulsador' }
    ], []);

    // Opciones de clasificación (memoizadas para evitar re-renders)
    const classificationOptions = useMemo(() => [
        { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
        { value: 'chalequeros', label: 'Chalequeros' },
        { value: 'bodega', label: 'Bodega' },
        { value: 'otras tiendas', label: 'Otras Tiendas' },
        { value: 'desconocida', label: 'Desconocida' },
        { value: 'pusher', label: 'Pusher' }
    ], []);

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
    }, [flash?.success, flash?.error]); // Solo depender de los valores específicos

    // Búsqueda automática con debounce - SOLO para searchQuery
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            // Solo ejecutar si realmente hay una búsqueda
            if (searchQuery.trim()) {
            router.get(route('dcs.pdvs.index'), {
                search: searchQuery || undefined,
                route_id: selectedRoute || undefined,
                status: selectedStatus || undefined,
                classification: selectedClassification || undefined
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
            }
        }, 500); // 500ms de delay

        setSearchDebounce(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [searchQuery]); // Solo cuando cambie searchQuery

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

        // Si se vacía la búsqueda, aplicar filtros inmediatamente
        if (!query.trim()) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
                setSearchDebounce(null);
            }
            // Para búsqueda vacía, usar setTimeout para evitar problemas de estado
            setTimeout(() => {
                applyFilters();
            }, 0);
        }
    };

    // Función helper para aplicar filtros - MEJORADA
    const applyFilters = (overrides = {}) => {
        const params: Record<string, string> = {};

        // Filtros básicos
        if (searchQuery?.trim()) params.search = searchQuery;
        if (selectedRoute?.trim()) params.route_id = selectedRoute;
        if (selectedStatus?.trim()) params.status = selectedStatus;
        if (selectedClassification?.trim()) params.classification = selectedClassification;

        // Filtros avanzados
        if (selectedDocumentType?.trim()) params.document_type = selectedDocumentType;
        if (sellsRecharge?.trim()) params.sells_recharge = sellsRecharge;
        if (selectedCircuit?.trim()) params.circuit_id = selectedCircuit;
        if (documentNumber?.trim()) params.document_number = documentNumber;
        if (clientName?.trim()) params.client_name = clientName;
        if (pointName?.trim()) params.point_name = pointName;
        if (posId?.trim()) params.pos_id = posId;

        // Aplicar overrides (como page, per_page)
        Object.assign(params, overrides);

        router.get(route('dcs.pdvs.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Función para cambiar de página
    const handlePageChange = (page: number) => {
        applyFilters({ page: page.toString() });
    };

    // Función para cambiar elementos por página
    const handlePerPageChange = (perPage: number) => {
        applyFilters({ per_page: perPage.toString(), page: '1' });
    };

    const handleRouteFilter = (routeId: string) => {
        const newRouteId = routeId === "all" ? "" : routeId;
        setSelectedRoute(newRouteId);
        setTimeout(() => applyFilters(), 0);
    };

    const handleStatusFilter = (status: string) => {
        const newStatus = status === "all" ? "" : status;
        setSelectedStatus(newStatus);
        setTimeout(() => applyFilters(), 0);
    };

    const handleClassificationFilter = (classification: string) => {
        const newClassification = classification === "all" ? "" : classification;
        setSelectedClassification(newClassification);
        setTimeout(() => applyFilters(), 0);
    };

    // Handlers para filtros avanzados que aplican automáticamente
    const handleAdvancedFilterChange = (filterType: string, value: string) => {
        switch (filterType) {
            case 'documentType':
                setSelectedDocumentType(value);
                break;
            case 'sellsRecharge':
                setSellsRecharge(value);
                break;
            case 'circuit':
                setSelectedCircuit(value);
                break;
            case 'documentNumber':
                setDocumentNumber(value);
                break;
            case 'clientName':
                setClientName(value);
                break;
            case 'pointName':
                setPointName(value);
                break;
            case 'posId':
                setPosId(value);
                break;
        }
        // Aplicar filtros después de un breve delay para permitir la actualización del estado
        setTimeout(() => applyFilters(), 300);
    };

    const clearFilters = () => {
        // Limpiar debounce activo
        if (searchDebounce) {
            clearTimeout(searchDebounce);
            setSearchDebounce(null);
        }

        // Resetear todos los estados básicos
        setSearchQuery('');
        setSelectedRoute('');
        setSelectedStatus('');
        setSelectedClassification('');

        // Resetear estados avanzados
        setSelectedDocumentType('');
        setSellsRecharge('');
        setSelectedCircuit('');
        setDocumentNumber('');
        setClientName('');
        setPointName('');
        setPosId('');

        // Aplicar filtros vacíos directamente
        router.get(route('dcs.pdvs.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
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

    // Verificar si hay filtros activos
    const hasActiveFilters = searchQuery || selectedRoute || selectedStatus || selectedClassification ||
                            selectedDocumentType || sellsRecharge || selectedCircuit || documentNumber ||
                            clientName || pointName || posId;

    // Contar filtros activos
    const activeFilterCount = [
        searchQuery, selectedRoute, selectedStatus, selectedClassification,
        selectedDocumentType, sellsRecharge, selectedCircuit, documentNumber,
        clientName, pointName, posId
    ].filter(Boolean).length;

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
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span>{routes.length} rutas</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Búsqueda incluye localidades</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-pdv-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateModal}
                                            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo PDV
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sistema de Filtros Avanzados */}
                    <AdvancedFilters
                        searchQuery={searchQuery}
                        selectedRoute={selectedRoute}
                        selectedStatus={selectedStatus}
                        selectedClassification={selectedClassification}
                        showAdvancedFilters={showAdvancedFilters}
                        selectedDocumentType={selectedDocumentType}
                        sellsRecharge={sellsRecharge}
                        selectedCircuit={selectedCircuit}
                        documentNumber={documentNumber}
                        clientName={clientName}
                        pointName={pointName}
                        posId={posId}
                        routes={routes}
                        statusOptions={statusOptions}
                        classificationOptions={classificationOptions}
                        circuits={circuits}
                        handleSearch={handleSearch}
                        handleRouteFilter={handleRouteFilter}
                        handleStatusFilter={handleStatusFilter}
                        handleClassificationFilter={handleClassificationFilter}
                        setShowAdvancedFilters={setShowAdvancedFilters}
                        setSelectedDocumentType={setSelectedDocumentType}
                        setSellsRecharge={setSellsRecharge}
                        setSelectedCircuit={setSelectedCircuit}
                        setDocumentNumber={setDocumentNumber}
                        setClientName={setClientName}
                        setPointName={setPointName}
                        setPosId={setPosId}
                        applyFilters={applyFilters}
                        clearFilters={clearFilters}
                        hasActiveFilters={hasActiveFilters}
                        activeFilterCount={activeFilterCount}
                    />

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
                                        circuits={circuits}
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

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-pdv-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
