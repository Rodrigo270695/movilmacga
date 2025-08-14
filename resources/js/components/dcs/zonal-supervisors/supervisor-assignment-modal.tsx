import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCheck, MapPin, Building2, Calendar } from 'lucide-react';

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
    status: boolean;
    business: Business;
    active_zonal_supervisor?: {
        id: number;
        user_id: number;
        assigned_at: string;
        notes?: string;
        supervisor: User;
    };
}

interface Props {
    zonal: Zonal;
    supervisors: User[];
    mode: 'assign' | 'reassign';
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    // Agregar información de asignaciones existentes
    supervisorAssignments?: {
        [supervisorId: number]: {
            count: number;
            zonals: string[];
        };
    };
}

export function SupervisorAssignmentModal({
    zonal,
    supervisors,
    mode,
    onClose,
    onSuccess,
    onError,
    supervisorAssignments = {}
}: Props) {
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(
        mode === 'reassign' && zonal.active_zonal_supervisor
            ? zonal.active_zonal_supervisor.user_id.toString()
            : ''
    );
    const [notes, setNotes] = useState<string>(
        mode === 'reassign' && zonal.active_zonal_supervisor?.notes
            ? zonal.active_zonal_supervisor.notes
            : ''
    );
    const [isLoading, setIsLoading] = useState(false);

    // Combinar supervisores disponibles con el supervisor actual (en modo reasignación)
    const availableSupervisors = React.useMemo(() => {
        let supervisorsList = [...supervisors];

        // Si estamos en modo reasignación, agregar el supervisor actual si no está en la lista
        if (mode === 'reassign' && zonal.active_zonal_supervisor) {
            const currentSupervisor = zonal.active_zonal_supervisor.supervisor;
            const isCurrentInList = supervisorsList.some(s => s.id === currentSupervisor.id);

            if (!isCurrentInList) {
                supervisorsList.unshift({
                    id: currentSupervisor.id,
                    first_name: currentSupervisor.first_name,
                    last_name: currentSupervisor.last_name,
                    email: currentSupervisor.email,
                    status: currentSupervisor.status
                });
            }
        }

        return supervisorsList;
    }, [supervisors, mode, zonal.active_zonal_supervisor]);

    // Obtener supervisor seleccionado
    const selectedSupervisor = availableSupervisors.find(s => s.id.toString() === selectedSupervisorId);

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSupervisorId) {
            onError('Debe seleccionar un supervisor.');
            return;
        }

        setIsLoading(true);

        const data = {
            zonal_id: zonal.id,
            user_id: parseInt(selectedSupervisorId),
            notes: notes.trim() || null,
        };

        try {
            if (mode === 'assign') {
                // Crear nueva asignación
                router.post(route('dcs.zonal-supervisors.store'), data, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        onSuccess('Supervisor asignado al zonal exitosamente.');
                    },
                    onError: (errors) => {
                        if (errors.zonal_id) {
                            onError(errors.zonal_id);
                        } else if (errors.user_id) {
                            onError(errors.user_id);
                        } else {
                            onError('Error al asignar supervisor al zonal.');
                        }
                    },
                    onFinish: () => setIsLoading(false)
                });
            } else {
                // Actualizar asignación existente
                router.put(route('dcs.zonal-supervisors.update', zonal.active_zonal_supervisor!.id), data, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        onSuccess('Asignación de supervisor actualizada exitosamente.');
                    },
                    onError: (errors) => {
                        if (errors.zonal_id) {
                            onError(errors.zonal_id);
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
                        {mode === 'assign' ? 'Asignar Supervisor' : 'Reasignar Supervisor'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'assign'
                            ? 'Asigna un supervisor para gestionar este zonal.'
                            : 'Cambia el supervisor asignado a este zonal.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información del zonal */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">Zonal Seleccionado</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{zonal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {zonal.business?.name || 'Sin negocio'}
                            </Badge>
                        </div>
                    </div>

                    {/* Supervisor actual (en modo reasignar) */}
                    {mode === 'reassign' && zonal.active_zonal_supervisor && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-yellow-800">Supervisor Actual</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                                {zonal.active_zonal_supervisor.supervisor.first_name}{' '}
                                {zonal.active_zonal_supervisor.supervisor.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{zonal.active_zonal_supervisor.supervisor.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    Asignado el {new Date(zonal.active_zonal_supervisor.assigned_at).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Seleccionar supervisor */}
                    <div className="space-y-2">
                        <Label htmlFor="supervisor" className="text-sm font-medium">
                            {mode === 'assign' ? 'Seleccionar Supervisor' : 'Nuevo Supervisor'}
                        </Label>
                        <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un supervisor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSupervisors.length > 0 ? (
                                    availableSupervisors.map((supervisor) => {
                                        const assignments = supervisorAssignments[supervisor.id];
                                        const isCurrentlyAssigned = zonal.active_zonal_supervisor?.user_id === supervisor.id;

                                        return (
                                            <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {supervisor.first_name} {supervisor.last_name}
                                                        </span>
                                                        {isCurrentlyAssigned && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Actual
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500">{supervisor.email}</span>
                                                    {assignments && assignments.count > 0 && (
                                                        <span className="text-xs text-blue-600">
                                                            {assignments.count} zonal{assignments.count > 1 ? 'es' : ''} asignado{assignments.count > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <SelectItem value="no-supervisors" disabled>
                                        No hay supervisores disponibles
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Información del supervisor seleccionado */}
                    {selectedSupervisor && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                                <UserCheck className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">Supervisor Seleccionado</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                                {selectedSupervisor.first_name} {selectedSupervisor.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{selectedSupervisor.email}</p>
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
                            disabled={!selectedSupervisorId || isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Procesando...
                                </>
                            ) : (
                                mode === 'assign' ? 'Asignar Supervisor' : 'Actualizar Asignación'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
