import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/ui/custom-select';
import {
    Search,
    X,
    ChevronDown,
    ChevronUp,
    Settings2,
    Tag
} from 'lucide-react';

interface AdvancedFiltersProps {
    // Valores de filtros
    searchQuery: string;
    selectedRoute: string;
    selectedStatus: string;
    selectedClassification: string;
    showAdvancedFilters: boolean;
    selectedDocumentType: string;
    sellsRecharge: string;
    selectedCircuit: string;
    documentNumber: string;
    clientName: string;
    pointName: string;
    posId: string;
    
    // Opciones para selects
    routes: Array<{id: number, name: string, code: string}>;
    statusOptions: Array<{value: string, label: string}>;
    classificationOptions: Array<{value: string, label: string}>;
    circuits: Array<{id: number, name: string, code: string}>;
    
    // Handlers
    handleSearch: (value: string) => void;
    handleRouteFilter: (value: string) => void;
    handleStatusFilter: (value: string) => void;
    handleClassificationFilter: (value: string) => void;
    setShowAdvancedFilters: (show: boolean) => void;
    setSelectedDocumentType: (value: string) => void;
    setSellsRecharge: (value: string) => void;
    setSelectedCircuit: (value: string) => void;
    setDocumentNumber: (value: string) => void;
    setClientName: (value: string) => void;
    setPointName: (value: string) => void;
    setPosId: (value: string) => void;
    applyFilters: () => void;
    clearFilters: () => void;
    
    // Estado
    hasActiveFilters: boolean;
    activeFilterCount: number;
}

export function AdvancedFilters({
    searchQuery,
    selectedRoute,
    selectedStatus,
    selectedClassification,
    showAdvancedFilters,
    selectedDocumentType,
    sellsRecharge,
    selectedCircuit,
    documentNumber,
    clientName,
    pointName,
    posId,
    routes,
    statusOptions,
    classificationOptions,
    circuits,
    handleSearch,
    handleRouteFilter,
    handleStatusFilter,
    handleClassificationFilter,
    setShowAdvancedFilters,
    setSelectedDocumentType,
    setSellsRecharge,
    setSelectedCircuit,
    setDocumentNumber,
    setClientName,
    setPointName,
    setPosId,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount
}: AdvancedFiltersProps) {

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Header de Filtros */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900">Búsqueda y Filtros</span>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} activo{activeFilterCount !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2"
                        >
                            <Settings2 className="w-4 h-4" />
                            Filtros Avanzados
                            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Buscador Principal Inteligente */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="🔍 Búsqueda inteligente: nombre del PDV, cliente, documento, teléfono, dirección, localidad..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Filtros Rápidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CustomSelect
                        value={selectedRoute || "all"}
                        onValueChange={handleRouteFilter}
                        options={[
                            { value: "all", label: "📍 Todas las rutas" },
                            ...routes.map((route) => ({
                                value: route.id.toString(),
                                label: `${route.name} - ${route.code}`
                            }))
                        ]}
                        placeholder="📍 Seleccionar ruta"
                        className="w-full"
                    />

                    <CustomSelect
                        value={selectedStatus || "all"}
                        onValueChange={handleStatusFilter}
                        options={[
                            { value: "all", label: "📊 Todos los estados" },
                            ...statusOptions.map(option => ({
                                ...option,
                                label: `${option.value === 'vende' ? '✅' : option.value === 'no vende' ? '❌' : option.value === 'no existe' ? '🚫' : '🔄'} ${option.label}`
                            }))
                        ]}
                        placeholder="📊 Estado del PDV"
                        className="w-full"
                    />

                    <CustomSelect
                        value={selectedClassification || "all"}
                        onValueChange={handleClassificationFilter}
                        options={[
                            { value: "all", label: "🏪 Todas las clasificaciones" },
                            ...classificationOptions.map(option => ({
                                ...option,
                                label: `${option.value === 'telecomunicaciones' ? '📱' : option.value === 'bodega' ? '🏪' : option.value === 'chalequeros' ? '🦺' : '🏬'} ${option.label}`
                            }))
                        ]}
                        placeholder="🏪 Tipo de negocio"
                        className="w-full"
                    />
                </div>

                {/* Panel de Filtros Avanzados */}
                {showAdvancedFilters && (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-700">Filtros Avanzados</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Filtros específicos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del PDV</label>
                                <Input
                                    placeholder="Ej: Tienda Central"
                                    value={pointName}
                                    onChange={(e) => setPointName(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                                <Input
                                    placeholder="Ej: Juan Pérez"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
                                <Input
                                    placeholder="DNI o RUC"
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">POS ID</label>
                                <Input
                                    placeholder="ID del POS"
                                    value={posId}
                                    onChange={(e) => setPosId(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                                <CustomSelect
                                    value={selectedDocumentType || "all"}
                                    onValueChange={(value) => setSelectedDocumentType(value === "all" ? "" : value)}
                                    options={[
                                        { value: "all", label: "Todos los tipos" },
                                        { value: "DNI", label: "📄 DNI" },
                                        { value: "RUC", label: "🏢 RUC" }
                                    ]}
                                    placeholder="Tipo de documento"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vende Recarga</label>
                                <CustomSelect
                                    value={sellsRecharge || "all"}
                                    onValueChange={(value) => setSellsRecharge(value === "all" ? "" : value)}
                                    options={[
                                        { value: "all", label: "Todos" },
                                        { value: "1", label: "✅ Sí vende recarga" },
                                        { value: "0", label: "❌ No vende recarga" }
                                    ]}
                                    placeholder="Vende recarga"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Circuito</label>
                                <CustomSelect
                                    value={selectedCircuit || "all"}
                                    onValueChange={(value) => setSelectedCircuit(value === "all" ? "" : value)}
                                    options={[
                                        { value: "all", label: "Todos los circuitos" },
                                        ...circuits.map((circuit) => ({
                                            value: circuit.id.toString(),
                                            label: `${circuit.name} (${circuit.code})`
                                        }))
                                    ]}
                                    placeholder="Seleccionar circuito"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyFilters()}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Aplicar Filtros
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tags de Filtros Activos */}
                {hasActiveFilters && (
                    <div className="flex items-start gap-2 pt-3 border-t border-gray-200">
                        <Tag className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                            {searchQuery && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    🔍 "{searchQuery}"
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-900" 
                                        onClick={() => handleSearch('')}
                                    />
                                </Badge>
                            )}
                            {selectedRoute && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    📍 {routes.find(r => r.id.toString() === selectedRoute)?.name}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-green-900" 
                                        onClick={() => handleRouteFilter("all")}
                                    />
                                </Badge>
                            )}
                            {selectedStatus && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    📊 {statusOptions.find(s => s.value === selectedStatus)?.label}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-yellow-900" 
                                        onClick={() => handleStatusFilter("all")}
                                    />
                                </Badge>
                            )}
                            {selectedClassification && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    🏪 {classificationOptions.find(c => c.value === selectedClassification)?.label}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-purple-900" 
                                        onClick={() => handleClassificationFilter("all")}
                                    />
                                </Badge>
                            )}
                            {pointName && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    🏢 PDV: {pointName}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-gray-900" 
                                        onClick={() => setPointName('')}
                                    />
                                </Badge>
                            )}
                            {clientName && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    👤 Cliente: {clientName}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-gray-900" 
                                        onClick={() => setClientName('')}
                                    />
                                </Badge>
                            )}
                            {documentNumber && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    📄 Doc: {documentNumber}
                                    <X 
                                        className="w-3 h-3 ml-1 cursor-pointer hover:text-gray-900" 
                                        onClick={() => setDocumentNumber('')}
                                    />
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}