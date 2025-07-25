import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { Network, MapPin, Search, X, Building2, AlertCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

interface Zonal {
    id: number;
    name: string;
    status?: boolean | number;
    business_id?: number | null;
}

interface Business {
    id: number;
    name: string;
    status?: boolean | number;
    zonales_count?: number;
    active_zonales_count?: number;
    created_at: string;
    zonales?: Zonal[];
}

interface AssociateZonalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    business: Business | null;
    availableZonales: Zonal[];
}

export function AssociateZonalesModal({ isOpen, onClose, business, availableZonales }: AssociateZonalesModalProps) {
    const { addToast } = useToast();
    const [selectedZonales, setSelectedZonales] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentZonales, setCurrentZonales] = useState<number[]>([]);

    // Cargar zonales actuales del negocio
    useEffect(() => {
        if (isOpen && business) {
            setIsLoading(true);
            fetch(route('admin.businesses.show', business.id), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            })
            .then(response => response.json())
            .then(data => {
                const assignedZonales = data.assignedZonales || [];
                setCurrentZonales(assignedZonales);
                setSelectedZonales(assignedZonales);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading business zonales:', error);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudieron cargar los zonales del negocio.',
                    duration: 4000
                });
                setIsLoading(false);
            });
        }
    }, [isOpen, business]);

    // Limpiar estados al cerrar
    useEffect(() => {
        if (!isOpen) {
            setSelectedZonales([]);
            setCurrentZonales([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    // Obtener todos los zonales (disponibles + asignados al negocio actual)
    const allZonales = useMemo(() => {
        const availableList = availableZonales.filter(zonal =>
            !zonal.business_id || (business && zonal.business_id === business.id)
        );
        return availableList;
    }, [availableZonales, business]);

    // Filtrar zonales por búsqueda
    const filteredZonales = useMemo(() => {
        if (!searchTerm.trim()) {
            return allZonales;
        }
        return allZonales.filter(zonal =>
            zonal.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allZonales, searchTerm]);

    const handleZonalToggle = (zonalId: number) => {
        setSelectedZonales(prev => {
            if (prev.includes(zonalId)) {
                return prev.filter(id => id !== zonalId);
            } else {
                return [...prev, zonalId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedZonales.length === filteredZonales.length) {
            setSelectedZonales([]);
        } else {
            setSelectedZonales(filteredZonales.map(z => z.id));
        }
    };

    const handleSubmit = () => {
        if (!business) return;

        setIsLoading(true);

        router.patch(route('admin.businesses.update', business.id), {
            name: business.name,
            zonal_ids: selectedZonales
        }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Zonales actualizados!',
                    message: `Se han asociado ${selectedZonales.length} zonales al negocio "${business.name}".`,
                    duration: 4000
                });
                onClose();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudieron actualizar los zonales del negocio.',
                    duration: 4000
                });
            },
            onFinish: () => setIsLoading(false)
        });
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // Calcular cambios
    const addedZonales = selectedZonales.filter(id => !currentZonales.includes(id));
    const removedZonales = currentZonales.filter(id => !selectedZonales.includes(id));
    const hasChanges = addedZonales.length > 0 || removedZonales.length > 0;

    const getZonalStatus = (zonal: Zonal) => {
        if (zonal.business_id === business?.id) {
            return 'current';
        } else if (zonal.business_id && zonal.business_id !== business?.id) {
            return 'assigned';
        } else {
            return 'available';
        }
    };

    if (!business) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                            <Network className="w-4 h-4 text-green-600" />
                        </div>
                        Gestionar Zonales
                    </DialogTitle>
                    <DialogDescription>
                        Administra los zonales asignados al negocio <strong>"{business.name}"</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                    {/* Estadísticas y búsqueda */}
                    <div className="flex-shrink-0 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <MapPin className="w-3 h-3 mr-1" />
                                {selectedZonales.length} seleccionados
                            </Badge>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                {allZonales.length} disponibles
                            </Badge>
                            {hasChanges && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {addedZonales.length + removedZonales.length} cambios
                                </Badge>
                            )}
                        </div>

                        {/* Barra de búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Buscar zonales..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Controles */}
                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={filteredZonales.length === 0}
                                className="cursor-pointer"
                            >
                                {selectedZonales.length === filteredZonales.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                            </Button>
                            <span className="text-sm text-gray-500">
                                {filteredZonales.length} zonales
                            </span>
                        </div>
                    </div>

                    {/* Lista de zonales */}
                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-2 text-gray-600">Cargando zonales...</span>
                            </div>
                        ) : filteredZonales.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>
                                    {searchTerm ? 'No se encontraron zonales' : 'No hay zonales disponibles'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2">
                                {filteredZonales.map(zonal => {
                                    const status = getZonalStatus(zonal);
                                    const isSelected = selectedZonales.includes(zonal.id);
                                    const wasAdded = addedZonales.includes(zonal.id);
                                    const wasRemoved = removedZonales.includes(zonal.id);

                                    return (
                                        <div
                                            key={zonal.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                                                isSelected
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                            } ${
                                                wasAdded ? 'ring-2 ring-green-200' :
                                                wasRemoved ? 'ring-2 ring-red-200' : ''
                                            }`}
                                        >
                                            <Checkbox
                                                id={`zonal-${zonal.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => handleZonalToggle(zonal.id)}
                                                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                            <Label
                                                htmlFor={`zonal-${zonal.id}`}
                                                className="flex-1 cursor-pointer font-medium text-gray-900"
                                            >
                                                {zonal.name}
                                            </Label>

                                            <div className="flex items-center gap-2">
                                                {wasAdded && (
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        Nuevo
                                                    </Badge>
                                                )}
                                                {wasRemoved && (
                                                    <Badge className="bg-red-100 text-red-800 text-xs">
                                                        Quitar
                                                    </Badge>
                                                )}
                                                {status === 'current' && !wasRemoved && (
                                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                        Actual
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Resumen de cambios */}
                    {hasChanges && (
                        <div className="flex-shrink-0 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <h4 className="font-medium text-yellow-800 mb-2">Resumen de cambios:</h4>
                            <div className="space-y-1 text-sm">
                                {addedZonales.length > 0 && (
                                    <p className="text-green-700">
                                        ✓ {addedZonales.length} zonales serán asignados
                                    </p>
                                )}
                                {removedZonales.length > 0 && (
                                    <p className="text-red-700">
                                        ✗ {removedZonales.length} zonales serán desasignados
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <div className="flex gap-2 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !hasChanges}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Guardando...</span>
                                </div>
                            ) : (
                                <span>Guardar Cambios</span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
