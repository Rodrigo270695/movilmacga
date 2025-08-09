import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Calendar, Search, RotateCcw } from 'lucide-react';

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
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    route_id?: string;
}

interface Opciones {
    businesses: Array<{ id: number; name: string }>;
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
    const [formData, setFormData] = useState<Filtros>(filtros);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Actualizar formData cuando cambien los filtros
    useEffect(() => {
        setFormData(filtros);
    }, [filtros]);

    const handleInputChange = (field: keyof Filtros, value: string | number | undefined) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);

        // Construir parámetros de búsqueda
        const params = new URLSearchParams();
        if (formData.fecha_desde) params.set('fecha_desde', formData.fecha_desde);
        if (formData.fecha_hasta) params.set('fecha_hasta', formData.fecha_hasta);
        if (formData.vendedor_id && formData.vendedor_id !== 'todos') params.set('vendedor_id', formData.vendedor_id);
        if (formData.pdv_id && formData.pdv_id !== 'todos') params.set('pdv_id', formData.pdv_id);
        if (formData.estado && formData.estado !== 'todos') params.set('estado', formData.estado);
        if (formData.business_id && formData.business_id !== 'todos') params.set('business_id', formData.business_id);
        if (formData.zonal_id && formData.zonal_id !== 'todos') params.set('zonal_id', formData.zonal_id);
        if (formData.circuit_id && formData.circuit_id !== 'todos') params.set('circuit_id', formData.circuit_id);
        if (formData.route_id && formData.route_id !== 'todos') params.set('route_id', formData.route_id);

        router.get('/reportes/pdvs-visitados', Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleClearFilters = () => {
        setFormData({
            fecha_desde: '',
            fecha_hasta: '',
            vendedor_id: undefined,
            pdv_id: undefined,
            estado: undefined,
            business_id: undefined,
            zonal_id: undefined,
            circuit_id: undefined,
            route_id: undefined
        });
    };

    const hasActiveFilters = () => {
        return formData.vendedor_id || formData.pdv_id || formData.estado ||
               formData.fecha_desde !== filtros.fecha_desde ||
               formData.fecha_hasta !== filtros.fecha_hasta;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros Avanzados</h3>
                        <p className="text-sm text-gray-600">Configura los filtros para personalizar el reporte</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearFilters}
                            size="sm"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Limpiar
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Aplicando...' : 'Aplicar'}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    {/* Filtros de Fechas */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">
                            Rango de Fechas
                        </Label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Fecha Desde */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_desde" className="text-xs text-gray-600">
                                    Fecha Desde
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="fecha_desde"
                                        type="date"
                                        value={formData.fecha_desde}
                                        onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Fecha Hasta */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_hasta" className="text-xs text-gray-600">
                                    Fecha Hasta
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="fecha_hasta"
                                        type="date"
                                        value={formData.fecha_hasta}
                                        onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Jerarquía Organizacional */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">
                            Jerarquía Organizacional
                        </Label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Negocio */}
                            <div className="space-y-2">
                                <Label htmlFor="business_id" className="text-xs text-gray-600">
                                    Negocio
                                </Label>
                                <Select
                                    value={formData.business_id || ''}
                                    onValueChange={(value) => handleInputChange('business_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar negocio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los negocios</SelectItem>
                                        {opciones.businesses.map((business) => (
                                            <SelectItem key={business.id} value={business.id.toString()}>
                                                {business.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Zonal */}
                            <div className="space-y-2">
                                <Label htmlFor="zonal_id" className="text-xs text-gray-600">
                                    Zonal
                                </Label>
                                <Select
                                    value={formData.zonal_id || ''}
                                    onValueChange={(value) => handleInputChange('zonal_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar zonal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los zonales</SelectItem>
                                        {opciones.zonales.map((zonal) => (
                                            <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                                {zonal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Circuito */}
                            <div className="space-y-2">
                                <Label htmlFor="circuit_id" className="text-xs text-gray-600">
                                    Circuito
                                </Label>
                                <Select
                                    value={formData.circuit_id || ''}
                                    onValueChange={(value) => handleInputChange('circuit_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar circuito" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los circuitos</SelectItem>
                                        {opciones.circuits.map((circuit) => (
                                            <SelectItem key={circuit.id} value={circuit.id.toString()}>
                                                {circuit.name} ({circuit.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ruta */}
                            <div className="space-y-2">
                                <Label htmlFor="route_id" className="text-xs text-gray-600">
                                    Ruta
                                </Label>
                                <Select
                                    value={formData.route_id || ''}
                                    onValueChange={(value) => handleInputChange('route_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar ruta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todas las rutas</SelectItem>
                                        {opciones.routes.map((route) => (
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
                        <Label className="text-sm font-medium text-gray-700">
                            Filtros Específicos
                        </Label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Vendedor */}
                            <div className="space-y-2">
                                <Label htmlFor="vendedor_id" className="text-xs text-gray-600">
                                    Vendedor
                                </Label>
                                <Select
                                    value={formData.vendedor_id || ''}
                                    onValueChange={(value) => handleInputChange('vendedor_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar vendedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los vendedores</SelectItem>
                                        {opciones.vendedores.map((vendedor) => (
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
                                    value={formData.pdv_id || ''}
                                    onValueChange={(value) => handleInputChange('pdv_id', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar PDV" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los PDVs</SelectItem>
                                        {opciones.pdvs.map((pdv) => (
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
                                    value={formData.estado || ''}
                                    onValueChange={(value) => handleInputChange('estado', value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los estados</SelectItem>
                                        {opciones.estados.map((estado) => (
                                            <SelectItem key={estado.value} value={estado.value}>
                                                {estado.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
