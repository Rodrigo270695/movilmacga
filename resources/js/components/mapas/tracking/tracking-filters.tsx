import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building2, Search, MapPin } from 'lucide-react';
import type { Circuit, Zonal } from '@/types/tracking';

interface TrackingFiltersProps {
    businessFilter: string;
    zonalFilter: string;
    circuitFilter: string;
    dateFrom: string;
    dateTo: string;
    zonales: Zonal[];
    circuits: Circuit[];
    onBusinessChange: (value: string) => void;
    onZonalChange: (value: string) => void;
    onCircuitChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onSearch: () => void;
    onClearFilters: () => void;
}

export default function TrackingFilters({
    businessFilter,
    zonalFilter,
    circuitFilter,
    dateFrom,
    dateTo,
    zonales,
    circuits,
    onBusinessChange,
    onZonalChange,
    onCircuitChange,
    onDateFromChange,
    onDateToChange,
    onSearch,
    onClearFilters
}: TrackingFiltersProps) {
    // Obtener negocios únicos (solo los que tienen business asociado)
    const uniqueBusinesses = Array.from(
        new Set(zonales.filter(zonal => zonal.business).map(zonal => zonal.business.name))
    ).map(businessName => {
        const business = zonales.find(z => z.business && z.business.name === businessName)?.business;
        return business;
    }).filter(Boolean);

    // Filtrar zonales por negocio seleccionado
    const filteredZonales = businessFilter === 'all'
        ? zonales
        : zonales.filter(zonal => zonal.business && zonal.business.name === businessFilter);

    // Filtrar circuitos por zonal seleccionado
    const filteredCircuits = zonalFilter === 'all'
        ? circuits
        : circuits.filter(circuit =>
            circuit.zonal && circuit.zonal.id.toString() === zonalFilter
        );

    return (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Filtros de Búsqueda
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Selector de Negocio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Empresa
                        </label>
                        <Select value={businessFilter} onValueChange={onBusinessChange}>
                            <SelectTrigger>
                                <Building2 className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Selecciona empresa" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="all">Todas las empresas</SelectItem>
                                {uniqueBusinesses.map(business => (
                                    <SelectItem key={business?.id} value={business?.name || ''}>
                                        {business?.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selector de Zonal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zonal
                        </label>
                        <Select value={zonalFilter} onValueChange={onZonalChange}>
                            <SelectTrigger>
                                <MapPin className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Selecciona zonal" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="all">Todas las zonales</SelectItem>
                                {filteredZonales.map(zonal => (
                                    <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                        {zonal.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selector de Circuito */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Circuito
                        </label>
                        <Select value={circuitFilter} onValueChange={onCircuitChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona circuito" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="all">Todos los circuitos</SelectItem>
                                {filteredCircuits.map(circuit => (
                                    <SelectItem key={circuit.id} value={circuit.id.toString()}>
                                        {circuit.code} - {circuit.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha
                        </label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => onDateFromChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Acciones
                        </label>
                        <Button
                            onClick={onSearch}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Search className="w-4 h-4" />
                            Buscar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="flex items-center gap-2"
                        >
                            Limpiar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
