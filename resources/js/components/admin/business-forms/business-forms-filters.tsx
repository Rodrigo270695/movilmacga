import { Button } from '@/components/ui/button';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface BusinessFormsFiltersProps {
    searchTerm: string;
    selectedBusiness: string;
    selectedStatus: string;
    businesses: Business[];
    onSearchChange: (value: string) => void;
    onBusinessChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onClearFilters: () => void;
}

export function BusinessFormsFilters({
    searchTerm,
    selectedBusiness,
    selectedStatus,
    businesses,
    onSearchChange,
    onBusinessChange,
    onStatusChange,
    onClearFilters
}: BusinessFormsFiltersProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar formularios..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Filtro por negocio */}
                    <div className="sm:w-48">
                        <select
                            value={selectedBusiness}
                            onChange={(e) => onBusinessChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Todos los negocios</option>
                            {businesses.map((business) => (
                                <option key={business.id} value={business.id}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por estado */}
                    <div className="sm:w-40">
                        <select
                            value={selectedStatus}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>

                    {/* Botón limpiar filtros */}
                    <div className="sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                            className="w-full sm:w-auto text-xs cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
