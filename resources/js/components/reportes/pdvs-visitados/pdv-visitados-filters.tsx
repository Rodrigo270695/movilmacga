import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, X, User, CircuitBoard, Building2, MapPin, Navigation } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
}

interface Filtros {
    fecha_desde: string;
    fecha_hasta: string;
    vendedor_id?: string;
    pdv_id?: string;
    estado?: string;
    mock_location?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    route_id?: string;
}

interface Opciones {
    businesses: Array<{ id: number; name: string }>;
    allZonales: Array<{ id: number; name: string; business_id?: number }>;
    allCircuits: Array<{ id: number; name: string; code: string; zonal_id?: number }>;
    zonales: Array<{ id: number; name: string }>;
    circuits: Array<{ id: number; name: string; code: string }>;
    routes: Array<{ id: number; name: string }>;
    vendedores: User[];
    pdvs: Pdv[];
    estados: Array<{ value: string; label: string }>;
}

interface PdvVisitadosFiltersProps {
    filtros: Filtros;
    opciones: Opciones;
}

export function PdvVisitadosFilters({ filtros, opciones }: PdvVisitadosFiltersProps) {
    // Validar que filtros y opciones existan
    const safeFiltros = filtros || {
        fecha_desde: '',
        fecha_hasta: ''
    };
    const safeOpciones = opciones || {
        businesses: [],
        allZonales: [],
        allCircuits: [],
        zonales: [],
        circuits: [],
        routes: [],
        vendedores: [],
        pdvs: [],
        estados: []
    };

    const [localFilters, setLocalFilters] = useState<Filtros>(safeFiltros);
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    // Filtrar zonales por negocio seleccionado (en memoria desde allZonales)
    const filteredZonales = localFilters.business_id && localFilters.business_id !== 'todos' && Array.isArray(safeOpciones.allZonales)
        ? safeOpciones.allZonales.filter(zonal => zonal.business_id?.toString() === localFilters.business_id)
        : (Array.isArray(safeOpciones.allZonales) ? safeOpciones.allZonales : []);

    // Filtrar circuitos por zonal seleccionado (en memoria desde allCircuits)
    const filteredCircuits = localFilters.zonal_id && localFilters.zonal_id !== 'todos' && Array.isArray(safeOpciones.allCircuits)
        ? safeOpciones.allCircuits.filter(circuit => circuit.zonal_id?.toString() === localFilters.zonal_id)
        : (Array.isArray(safeOpciones.allCircuits) ? safeOpciones.allCircuits : []);

    // Filtrar rutas por circuito seleccionado (en memoria desde routes)
    const filteredRoutes = localFilters.circuit_id && localFilters.circuit_id !== 'todos' && Array.isArray(safeOpciones.routes)
        ? safeOpciones.routes.filter(route => route.circuit_id?.toString() === localFilters.circuit_id)
        : (Array.isArray(safeOpciones.routes) ? safeOpciones.routes : []);

    // Detectar si hay filtros activos
    useEffect(() => {
        const active = Object.entries(safeFiltros).some(([key, value]) => {
            if (key === 'fecha_desde' || key === 'fecha_hasta') {
                return false; // Las fechas no cuentan como filtros activos
            }
            return value && value !== 'todos' && value !== '';
        });
        setHasActiveFilters(active);
    }, [safeFiltros]);

    // Sincronizar filtros locales con los del servidor
    // CORREGIDO: Usar useRef para evitar loops infinitos
    const prevFiltersRef = useRef<string>('');
    
    useEffect(() => {
        // Crear objeto de filtros desde el servidor
        const newFilters: Filtros = {
            fecha_desde: safeFiltros.fecha_desde ?? '',
            fecha_hasta: safeFiltros.fecha_hasta ?? '',
            vendedor_id: safeFiltros.vendedor_id,
            pdv_id: safeFiltros.pdv_id,
            estado: safeFiltros.estado,
            mock_location: safeFiltros.mock_location,
            business_id: safeFiltros.business_id,
            zonal_id: safeFiltros.zonal_id,
            circuit_id: safeFiltros.circuit_id,
            route_id: safeFiltros.route_id,
        };
        
        // Serializar para comparar
        const newFiltersString = JSON.stringify(newFilters);
        
        // Solo actualizar si los filtros realmente cambiaron (evitar loops infinitos)
        if (newFiltersString !== prevFiltersRef.current) {
            prevFiltersRef.current = newFiltersString;
            setLocalFilters(newFilters);
        }
    }, [safeFiltros]);

    const handleFilterChange = (key: keyof Filtros, value: string) => {
        const newFilters = {
            ...localFilters,
            [key]: value === 'todos' || value === '' ? undefined : value
        };

        // Limpiar filtros dependientes cuando cambie la jerarquía
        if (key === 'business_id') {
            newFilters.zonal_id = undefined;
            newFilters.circuit_id = undefined;
            newFilters.route_id = undefined;
            newFilters.vendedor_id = undefined;
            newFilters.pdv_id = undefined;
        } else if (key === 'zonal_id') {
            newFilters.circuit_id = undefined;
            newFilters.route_id = undefined;
            newFilters.vendedor_id = undefined;
            newFilters.pdv_id = undefined;
        } else if (key === 'circuit_id') {
            newFilters.route_id = undefined;
            newFilters.vendedor_id = undefined;
            newFilters.pdv_id = undefined;
        } else if (key === 'route_id') {
            newFilters.pdv_id = undefined;
        }

        setLocalFilters(newFilters);

        // Aplicar filtros inmediatamente
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue && filterValue !== 'todos' && filterValue !== '') {
                params.set(filterKey, filterValue);
            }
        });

        params.set('page', '1'); // Resetear a primera página

        router.visit(`/reportes/pdvs-visitados?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setLocalFilters({
            fecha_desde: localFilters.fecha_desde || '',
            fecha_hasta: localFilters.fecha_hasta || ''
        });
        const params = new URLSearchParams();
        if (localFilters.fecha_desde) params.set('fecha_desde', localFilters.fecha_desde);
        if (localFilters.fecha_hasta) params.set('fecha_hasta', localFilters.fecha_hasta);
        
        router.visit(`/reportes/pdvs-visitados?${params.toString()}`, {
            preserveState: false,
            preserveScroll: false
        });
    };

    return (
        <Card className="border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6">
                {/* Header de filtros */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Filter className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Filtros de Búsqueda</h3>
                            <p className="text-xs text-gray-500">Filtra las visitas por diferentes criterios</p>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>

                {/* Filtros */}
                <div className="space-y-6">
                    {/* Filtros de Fechas */}
                    <div className="space-y-4">
                        <Label className="text-xs font-medium text-gray-700">Rango de Fechas</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Fecha Desde */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_desde" className="text-xs text-gray-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Fecha Desde
                                </Label>
                                <Input
                                    id="fecha_desde"
                                    type="date"
                                    value={localFilters.fecha_desde || ''}
                                    onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            {/* Fecha Hasta */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_hasta" className="text-xs text-gray-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Fecha Hasta
                                </Label>
                                <Input
                                    id="fecha_hasta"
                                    type="date"
                                    value={localFilters.fecha_hasta || ''}
                                    onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Jerarquía Organizacional */}
                    <div className="space-y-4">
                        <Label className="text-xs font-medium text-gray-700">Jerarquía Organizacional</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Negocio */}
                            <div className="space-y-2">
                                <Label htmlFor="business_id" className="text-xs text-gray-600 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    Negocio
                                </Label>
                                <Select
                                    value={localFilters.business_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('business_id', value)}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Seleccionar negocio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los negocios</SelectItem>
                                        {Array.isArray(safeOpciones.businesses) && safeOpciones.businesses.map((business) => (
                                            <SelectItem key={business.id} value={business.id.toString()}>
                                                {business.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Zonal */}
                            <div className="space-y-2">
                                <Label htmlFor="zonal_id" className="text-xs text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Zonal
                                </Label>
                                <Select
                                    value={localFilters.zonal_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('zonal_id', value)}
                                    disabled={!localFilters.business_id || localFilters.business_id === 'todos'}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={localFilters.business_id && localFilters.business_id !== 'todos' ? 'Seleccionar zonal' : 'Selecciona un negocio primero'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            {localFilters.business_id && localFilters.business_id !== 'todos' ? 'Todos los zonales' : 'Selecciona un negocio primero'}
                                        </SelectItem>
                                        {filteredZonales.map((zonal) => (
                                            <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                                {zonal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Circuito */}
                            <div className="space-y-2">
                                <Label htmlFor="circuit_id" className="text-xs text-gray-600 flex items-center gap-1">
                                    <CircuitBoard className="w-3 h-3" />
                                    Circuito
                                </Label>
                                <Select
                                    value={localFilters.circuit_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('circuit_id', value)}
                                    disabled={!localFilters.zonal_id || localFilters.zonal_id === 'todos'}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={localFilters.zonal_id && localFilters.zonal_id !== 'todos' ? 'Seleccionar circuito' : 'Selecciona un zonal primero'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            {localFilters.zonal_id && localFilters.zonal_id !== 'todos' ? 'Todos los circuitos' : 'Selecciona un zonal primero'}
                                        </SelectItem>
                                        {filteredCircuits.map((circuit) => (
                                            <SelectItem key={circuit.id} value={circuit.id.toString()}>
                                                {circuit.name} ({circuit.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ruta */}
                            <div className="space-y-2">
                                <Label htmlFor="route_id" className="text-xs text-gray-600 flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    Ruta
                                </Label>
                                <Select
                                    value={localFilters.route_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('route_id', value)}
                                    disabled={!localFilters.circuit_id || localFilters.circuit_id === 'todos'}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={localFilters.circuit_id && localFilters.circuit_id !== 'todos' ? 'Seleccionar ruta' : 'Selecciona un circuito primero'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            {localFilters.circuit_id && localFilters.circuit_id !== 'todos' ? 'Todas las rutas' : 'Selecciona un circuito primero'}
                                        </SelectItem>
                                        {filteredRoutes.map((route) => (
                                            <SelectItem key={route.id} value={route.id.toString()}>
                                                {route.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Filtros Específicos */}
                    <div className="space-y-4">
                        <Label className="text-xs font-medium text-gray-700">Filtros Específicos</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Vendedor */}
                            <div className="space-y-2">
                                <Label htmlFor="vendedor_id" className="text-xs text-gray-600 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Vendedor
                                </Label>
                                <Select
                                    value={localFilters.vendedor_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('vendedor_id', value)}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Seleccionar vendedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los vendedores</SelectItem>
                                        {Array.isArray(safeOpciones.vendedores) && safeOpciones.vendedores.map((vendedor) => (
                                            <SelectItem key={vendedor.id} value={vendedor.id.toString()}>
                                                {vendedor.first_name} {vendedor.last_name} ({vendedor.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PDV */}
                            <div className="space-y-2">
                                <Label htmlFor="pdv_id" className="text-xs text-gray-600">
                                    PDV
                                </Label>
                                <Select
                                    value={localFilters.pdv_id || 'todos'}
                                    onValueChange={(value) => handleFilterChange('pdv_id', value)}
                                    disabled={!localFilters.route_id || localFilters.route_id === 'todos'}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={localFilters.route_id && localFilters.route_id !== 'todos' ? 'Seleccionar PDV' : 'Selecciona una ruta primero'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            {localFilters.route_id && localFilters.route_id !== 'todos' ? 'Todos los PDVs' : 'Selecciona una ruta primero'}
                                        </SelectItem>
                                        {Array.isArray(safeOpciones.pdvs) && safeOpciones.pdvs.map((pdv) => (
                                            <SelectItem key={pdv.id} value={pdv.id.toString()}>
                                                {pdv.point_name} - {pdv.client_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado de Visita */}
                            <div className="space-y-2">
                                <Label htmlFor="estado" className="text-xs text-gray-600">
                                    Estado de Visita
                                </Label>
                                <Select
                                    value={localFilters.estado || 'todos'}
                                    onValueChange={(value) => handleFilterChange('estado', value)}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los estados</SelectItem>
                                        {Array.isArray(safeOpciones.estados) && safeOpciones.estados.map((estado) => (
                                            <SelectItem key={estado.value} value={estado.value}>
                                                {estado.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mock Location */}
                            <div className="space-y-2">
                                <Label htmlFor="mock_location" className="text-xs text-gray-600">
                                    Mock Location
                                </Label>
                                <Select
                                    value={localFilters.mock_location || 'todos'}
                                    onValueChange={(value) => handleFilterChange('mock_location', value)}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="real">Ubicación Real</SelectItem>
                                        <SelectItem value="mock">Mock Detectado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
