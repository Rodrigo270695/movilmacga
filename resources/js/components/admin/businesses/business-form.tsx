import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { router, useForm } from '@inertiajs/react';
import { Building2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface BusinessFormProps {
    isOpen: boolean;
    onClose: () => void;
    business?: Business | null;
    availableZonales: Zonal[];
}

export function BusinessForm({ isOpen, onClose, business, availableZonales }: BusinessFormProps) {
    const isEditing = !!business;
    const { addToast } = useToast();
    const [selectedZonales, setSelectedZonales] = useState<number[]>([]);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        zonal_ids: [] as number[],
    });

    // Resetear y cargar datos cuando cambia el business
    useEffect(() => {
        if (isOpen) {
            if (isEditing && business) {
                setData({
                    name: business.name || '',
                    zonal_ids: [],
                });

                // Cargar zonales asignados
                if (business.id) {
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
                        setSelectedZonales(assignedZonales);
                        setData(prev => ({ ...prev, zonal_ids: assignedZonales }));
                    })
                    .catch(error => {
                        console.error('Error loading business zonales:', error);
                    });
                }
            } else {
                reset();
                setSelectedZonales([]);
            }
            clearErrors();
        }
    }, [isOpen, isEditing, business]);

    // Sincronizar zonales seleccionados con form data
    useEffect(() => {
        setData(prev => ({ ...prev, zonal_ids: selectedZonales }));
    }, [selectedZonales]);

    const handleZonalToggle = (zonalId: number) => {
        setSelectedZonales(prev => {
            if (prev.includes(zonalId)) {
                return prev.filter(id => id !== zonalId);
            } else {
                return [...prev, zonalId];
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                const action = isEditing ? 'actualizado' : 'creado';
                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Negocio ${action} exitosamente.`,
                    duration: 4000
                });
                onClose();
                reset();
                setSelectedZonales([]);
            },
            onError: (errors: any) => {
                addToast({
                    type: 'error',
                    title: 'Error de validación',
                    message: 'Por favor, revisa los datos ingresados.',
                    duration: 4000
                });
            }
        };

        if (isEditing && business) {
            patch(route('admin.businesses.update', business.id), options);
        } else {
            post(route('admin.businesses.store'), options);
        }
    };

    const handleClose = () => {
        reset();
        clearErrors();
        setSelectedZonales([]);
        onClose();
    };

    // Obtener zonales disponibles (no asignados a otros negocios o asignados al negocio actual)
    const getAvailableZonales = () => {
        return availableZonales.filter(zonal =>
            !zonal.business_id || (isEditing && zonal.business_id === business?.id)
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-md w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        {isEditing ? 'Editar Negocio' : 'Crear Nuevo Negocio'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos del negocio y gestiona sus zonales asignados.'
                            : 'Completa la información para crear un nuevo negocio.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 px-1">
                        {/* Nombre del negocio */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Nombre del Negocio
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Ej: Tech Solutions Corp"
                                className={errors.name ? 'border-red-500' : ''}
                                required
                                maxLength={50}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Selección de zonales */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <Label className="text-sm font-medium">
                                    Zonales Asignados ({selectedZonales.length})
                                </Label>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                                {getAvailableZonales().length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No hay zonales disponibles para asignar
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {getAvailableZonales().map(zonal => (
                                            <div key={zonal.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded transition-colors">
                                                <Checkbox
                                                    id={`zonal-${zonal.id}`}
                                                    checked={selectedZonales.includes(zonal.id)}
                                                    onCheckedChange={() => handleZonalToggle(zonal.id)}
                                                />
                                                <Label
                                                    htmlFor={`zonal-${zonal.id}`}
                                                    className="text-sm cursor-pointer flex-1"
                                                >
                                                    {zonal.name}
                                                </Label>
                                                {zonal.business_id === business?.id && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {errors.zonal_ids && (
                                <p className="text-sm text-red-600">{errors.zonal_ids}</p>
                            )}
                        </div>

                        {/* Información adicional */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>Nota:</strong> Los zonales seleccionados serán asignados exclusivamente a este negocio.
                                Si un zonal ya está asignado a otro negocio, será reasignado automáticamente.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 pt-4 border-t">
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={processing}
                                className="flex-1 cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.name.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>{isEditing ? 'Actualizando...' : 'Creando...'}</span>
                                    </div>
                                ) : (
                                    <span>{isEditing ? 'Actualizar' : 'Crear'} Negocio</span>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
