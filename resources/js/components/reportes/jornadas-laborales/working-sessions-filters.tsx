import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Filter, X, Calendar, User, CircuitBoard, Building2, MapPin } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id?: number;
    business?: {
        id: number;
        name: string;
    };
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id?: number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Filtros {
    date_from?: string;
    date_to?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    user_id?: string;
    status?: string;
}

interface Opciones {
    businesses: Business[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    zonales: Zonal[];
    circuits: Circuit[];
    users: User[];
    statuses: Array<{ value: string; label: string }>;
}

interface WorkingSessionsFiltersProps {
    filtros: Filtros;
    opciones: Opciones;
}

export function WorkingSessionsFilters({ filtros, opciones }: WorkingSessionsFiltersProps) {
    // Validar que filtros y opciones existan
    const safeFiltros = filtros || {};
    const safeOpciones = opciones || {
        businesses: [],
        allZonales: [],
        allCircuits: [],
        zonales: [],
        circuits: [],
        users: [],
        statuses: []
    };

    const [localFilters, setLocalFilters] = useState<Filtros>(safeFiltros);
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    // Filtrar zonales por negocio seleccionado
    const filteredZonales = localFilters.business_id && Array.isArray(safeOpciones.allZonales)
        ? safeOpciones.allZonales.filter(zonal => zonal.business_id?.toString() === localFilters.business_id)
        : (Array.isArray(safeOpciones.allZonales) ? safeOpciones.allZonales : []);

    // Filtrar circuitos por zonal seleccionado
    const filteredCircuits = localFilters.zonal_id && Array.isArray(safeOpciones.allCircuits)
        ? safeOpciones.allCircuits.filter(circuit => circuit.zonal_id?.toString() === localFilters.zonal_id)
        : (Array.isArray(safeOpciones.allCircuits) ? safeOpciones.allCircuits : []);

    // Detectar si hay filtros activos
    useEffect(() => {
        const active = Object.values(safeFiltros).some(value => value && value !== 'todos');
        setHasActiveFilters(active);
    }, [safeFiltros]);

    // Sincronizar filtros locales con los del servidor
    useEffect(() => {
        setLocalFilters(safeFiltros);
    }, [safeFiltros]);



    const handleFilterChange = (key: keyof Filtros, value: string) => {
        const newFilters = {
            ...localFilters,
            [key]: value === 'todos' ? undefined : value
        };

        // Limpiar filtros dependientes cuando cambie la jerarquía
        if (key === 'business_id') {
            newFilters.zonal_id = undefined;
            newFilters.circuit_id = undefined;
            newFilters.user_id = undefined;
        } else if (key === 'zonal_id') {
            newFilters.circuit_id = undefined;
            newFilters.user_id = undefined;
        } else if (key === 'circuit_id') {
            newFilters.user_id = undefined;
        }

        setLocalFilters(newFilters);

        // Aplicar filtros inmediatamente
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue && filterValue !== 'todos') {
                params.set(filterKey, filterValue);
            }
        });

        // Preservar el per_page actual si existe
        const currentPerPage = new URLSearchParams(window.location.search).get('per_page');
        if (currentPerPage) {
            params.set('per_page', currentPerPage);
        }

        params.set('page', '1'); // Resetear a primera página

        router.visit(`/reportes/jornadas-laborales?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true
        });
    };



    const clearFilters = () => {
        setLocalFilters({
            date_from: localFilters.date_from,
            date_to: localFilters.date_to
        });
        router.visit('/reportes/jornadas-laborales', {
            preserveState: false,
            preserveScroll: false
        });
    };



    // Función para obtener el placeholder del usuario según los filtros aplicados
    const getUserPlaceholder = () => {
        if (!localFilters.business_id || localFilters.business_id === 'todos') {
            return 'Selecciona un negocio primero';
        }
        if (localFilters.circuit_id && localFilters.circuit_id !== 'todos') {
            return 'Todos los vendedores del circuito';
        }
        if (localFilters.zonal_id && localFilters.zonal_id !== 'todos') {
            return 'Todos los vendedores del zonal';
        }
        return 'Todos los vendedores del negocio';
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
                            <p className="text-xs text-gray-500">Filtra las jornadas laborales por diferentes criterios</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Fecha desde */}
                    <div className="space-y-2">
                        <Label htmlFor="date_from" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Fecha desde
                        </Label>
                        <Input
                            id="date_from"
                            type="date"
                            value={localFilters.date_from || ''}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            className="text-sm"
                        />
                    </div>

                    {/* Fecha hasta */}
                    <div className="space-y-2">
                        <Label htmlFor="date_to" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Fecha hasta
                        </Label>
                        <Input
                            id="date_to"
                            type="date"
                            value={localFilters.date_to || ''}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            className="text-sm"
                        />
                    </div>

                    {/* Negocio */}
                    <div className="space-y-2">
                        <Label htmlFor="business_id" className="text-xs font-medium text-gray-700 flex items-center gap-1">
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
                                {safeOpciones.businesses.map((business) => (
                                    <SelectItem key={business.id} value={business.id.toString()}>
                                        {business.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Zonal */}
                    <div className="space-y-2">
                        <Label htmlFor="zonal_id" className="text-xs font-medium text-gray-700 flex items-center gap-1">
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
                        <Label htmlFor="circuit_id" className="text-xs font-medium text-gray-700 flex items-center gap-1">
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
                                        {circuit.name} - {circuit.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Usuario */}
                    <div className="space-y-2">
                        <Label htmlFor="user_id" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Usuario
                        </Label>
                        <Select
                            value={localFilters.user_id || 'todos'}
                            onValueChange={(value) => handleFilterChange('user_id', value)}
                            disabled={!localFilters.business_id || localFilters.business_id === 'todos'}
                        >
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder={getUserPlaceholder()} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">
                                    {getUserPlaceholder()}
                                </SelectItem>
                                {safeOpciones.users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filtro de estado */}
                <div className="mt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Estado de la jornada</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={localFilters.status === 'todos' || !localFilters.status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterChange('status', 'todos')}
                                className={`text-xs cursor-pointer ${
                                    localFilters.status === 'todos' || !localFilters.status
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                Todos
                            </Button>
                            {safeOpciones.statuses.map((status) => (
                                <Button
                                    key={status.value}
                                    variant={localFilters.status === status.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleFilterChange('status', status.value)}
                                    className={`text-xs cursor-pointer ${
                                        status.value === 'active'
                                            ? localFilters.status === status.value
                                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                                : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                            : localFilters.status === status.value
                                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                                : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}
                                >
                                    {status.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>


            </div>
        </Card>
    );
}
