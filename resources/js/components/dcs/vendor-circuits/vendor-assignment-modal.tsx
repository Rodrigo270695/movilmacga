import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Truck, Building2, Calendar, MapPin } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: boolean;
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id: number;
    business: Business;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    status: boolean;
    zonal: Zonal;
    active_user_circuits?: {
        id: number;
        user_id: number;
        assigned_date: string;
        priority: number;
        notes?: string;
        user: User;
    }[];
}

interface Props {
    circuit: Circuit;
    vendors: User[];
    mode: 'assign' | 'reassign';
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function VendorAssignmentModal({
    circuit,
    vendors,
    mode,
    onClose,
    onSuccess,
    onError
}: Props) {
    const [selectedVendorId, setSelectedVendorId] = useState<string>(
        mode === 'reassign' && circuit.active_user_circuits?.[0]
            ? circuit.active_user_circuits[0].user_id.toString()
            : ''
    );
    const [priority, setPriority] = useState<string>(
        mode === 'reassign' && circuit.active_user_circuits?.[0]
            ? circuit.active_user_circuits[0].priority.toString()
            : '1'
    );
    const [notes, setNotes] = useState<string>(
        mode === 'reassign' && circuit.active_user_circuits?.[0]?.notes
            ? circuit.active_user_circuits[0].notes
            : ''
    );
    const [isLoading, setIsLoading] = useState(false);

    // Todos los vendedores disponibles (pueden tener múltiples circuitos)
    const availableVendors = React.useMemo(() => {
        return [...vendors];
    }, [vendors]);

    // Obtener vendedor seleccionado
    const selectedVendor = availableVendors.find(v => v.id.toString() === selectedVendorId);

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendorId) {
            onError('Debe seleccionar un vendedor.');
            return;
        }

        setIsLoading(true);

        const data = {
            circuit_id: circuit.id,
            user_id: parseInt(selectedVendorId),
            priority: parseInt(priority),
            notes: notes.trim() || null,
        };

        try {
            if (mode === 'assign') {
                // Crear nueva asignación
                router.post(route('dcs.vendor-circuits.store'), data, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        onSuccess('Vendedor asignado al circuito exitosamente.');
                    },
                    onError: (errors) => {
                        if (errors.circuit_id) {
                            onError(errors.circuit_id);
                        } else if (errors.user_id) {
                            onError(errors.user_id);
                        } else {
                            onError('Error al asignar vendedor al circuito.');
                        }
                    },
                    onFinish: () => setIsLoading(false)
                });
            } else {
                // Actualizar asignación existente
                router.put(route('dcs.vendor-circuits.update', circuit.active_user_circuits![0].id), data, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        onSuccess('Asignación de vendedor actualizada exitosamente.');
                    },
                    onError: (errors) => {
                        if (errors.circuit_id) {
                            onError(errors.circuit_id);
                        } else if (errors.user_id) {
                            onError(errors.user_id);
                        } else {
                            onError('Error al actualizar la asignación.');
                        }
                    },
                    onFinish: () => setIsLoading(false)
                });
            }
        } catch (error) {
            onError('Error inesperado al procesar la asignación.');
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        {mode === 'assign' ? 'Asignar Vendedor' : 'Reasignar Vendedor'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'assign'
                            ? 'Asigna un vendedor adicional para gestionar este circuito. Los vendedores pueden tener múltiples circuitos asignados.'
                            : 'Modifica la asignación de este vendedor al circuito.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información del circuito */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">Circuito Seleccionado</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{circuit.name}</p>
                        <p className="text-sm text-gray-600">{circuit.code}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {circuit.zonal.business?.name || 'Sin negocio'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{circuit.zonal.name}</span>
                        </div>
                    </div>

                    {/* Vendedor actual (en modo reasignar) */}
                    {mode === 'reassign' && circuit.active_user_circuits?.[0] && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-yellow-800">Vendedor Actual</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                                {circuit.active_user_circuits[0].user.first_name}{' '}
                                {circuit.active_user_circuits[0].user.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{circuit.active_user_circuits[0].user.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    Asignado el {new Date(circuit.active_user_circuits[0].assigned_date).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                            <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                    Prioridad {circuit.active_user_circuits[0].priority}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Seleccionar vendedor */}
                    <div className="space-y-2">
                        <Label htmlFor="vendor" className="text-sm font-medium">
                            {mode === 'assign' ? 'Seleccionar Vendedor' : 'Cambiar Vendedor'}
                        </Label>
                        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un vendedor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableVendors.length > 0 ? (
                                    availableVendors.map((vendor) => (
                                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {vendor.first_name} {vendor.last_name}
                                                </span>
                                                <span className="text-sm text-gray-500">{vendor.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-vendors" disabled>
                                        No hay vendedores disponibles
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Prioridad */}
                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium">
                            Prioridad
                        </Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 - Alta</SelectItem>
                                <SelectItem value="2">2 - Media-Alta</SelectItem>
                                <SelectItem value="3">3 - Media</SelectItem>
                                <SelectItem value="4">4 - Media-Baja</SelectItem>
                                <SelectItem value="5">5 - Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Información del vendedor seleccionado */}
                    {selectedVendor && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                                <UserCheck className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">Vendedor Seleccionado</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                                {selectedVendor.first_name} {selectedVendor.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{selectedVendor.email}</p>
                            <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                    Prioridad {priority}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Observaciones */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Observaciones (opcional)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Agregue observaciones sobre esta asignación..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-20"
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500">{notes.length}/1000 caracteres</p>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedVendorId || isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Procesando...
                                </>
                            ) : (
                                mode === 'assign' ? 'Asignar Vendedor' : 'Actualizar Asignación'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
