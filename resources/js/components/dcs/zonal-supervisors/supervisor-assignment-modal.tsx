import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCheck, MapPin, Building2, Calendar, UserX } from 'lucide-react';

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

interface ZonalSupervisorAssignment {
    id: number;
    user_id: number;
    assigned_at: string;
    notes?: string;
    supervisor: User;
}

interface Zonal {
    id: number;
    name: string;
    status: boolean;
    business: Business;
    active_zonal_supervisors?: ZonalSupervisorAssignment[];
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
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Obtener supervisores actualmente asignados
    const currentSupervisors = zonal.active_zonal_supervisors || [];
    const maxSupervisors = 5;
    const canAddMore = currentSupervisors.length < maxSupervisors;

    // Filtrar supervisores disponibles (excluir los ya asignados)
    const availableSupervisors = React.useMemo(() => {
        const assignedSupervisorIds = currentSupervisors.map(cs => cs.user_id);
        return supervisors
            .filter(s => !assignedSupervisorIds.includes(s.id))
            .sort((a, b) => b.last_name.localeCompare(a.last_name, 'es', { sensitivity: 'base' }));
    }, [supervisors, currentSupervisors]);

    // Obtener supervisor seleccionado
    const selectedSupervisor = availableSupervisors.find(s => s.id.toString() === selectedSupervisorId);

    // Manejar envío del formulario (siempre agrega, nunca reemplaza)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSupervisorId) {
            onError('Debe seleccionar un supervisor.');
            return;
        }

        if (currentSupervisors.length >= maxSupervisors) {
            onError(`Este zonal ya tiene el máximo de ${maxSupervisors} supervisores asignados.`);
            return;
        }

        setIsLoading(true);

        const data = {
            zonal_id: zonal.id,
            user_id: parseInt(selectedSupervisorId),
            notes: notes.trim() || null,
        };

        // Siempre crear nueva asignación (agregar)
        router.post(route('dcs.zonal-supervisors.store'), data, {
            preserveState: false, // Cambiar a false para forzar recarga de datos
            preserveScroll: true,
            onSuccess: () => {
                setSelectedSupervisorId('');
                setNotes('');
                // No cerrar el modal para que el usuario pueda seguir agregando
                onSuccess('Supervisor asignado al zonal exitosamente.');
            },
            onError: (errors: any) => {
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
    };

    // Manejar desasignación de un supervisor
    const handleUnassign = (assignmentId: number, supervisorName: string) => {
        if (currentSupervisors.length === 1) {
            onError('No puedes desasignar el último supervisor. El zonal debe tener al menos un supervisor.');
            return;
        }

        if (!confirm(`¿Estás seguro de desasignar a ${supervisorName} de este zonal?`)) {
            return;
        }

        router.delete(route('dcs.zonal-supervisors.destroy', assignmentId), {
            preserveState: false, // Forzar recarga
            preserveScroll: true,
            onSuccess: () => {
                onSuccess(`Supervisor ${supervisorName} desasignado exitosamente.`);
            },
            onError: () => {
                onError('Error al desasignar supervisor.');
            }
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        Gestionar Supervisores del Zonal
                    </DialogTitle>
                    <DialogDescription>
                        Administra los supervisores asignados a este zonal (máximo {maxSupervisors}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del zonal */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">Zonal Seleccionado</span>
                            </div>
                            <Badge 
                                variant={currentSupervisors.length === maxSupervisors ? "default" : "secondary"}
                                className={currentSupervisors.length === maxSupervisors ? "bg-green-100 text-green-700" : ""}
                            >
                                {currentSupervisors.length}/{maxSupervisors} Supervisores
                            </Badge>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{zonal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {zonal.business?.name || 'Sin negocio'}
                            </Badge>
                        </div>
                    </div>

                    {/* Supervisores actualmente asignados */}
                    {currentSupervisors.length > 0 && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                                <UserCheck className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">Supervisores Asignados</span>
                            </div>
                            <div className="space-y-2">
                                {currentSupervisors.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">
                                                {assignment.supervisor.last_name} {assignment.supervisor.first_name}
                                            </p>
                                            <p className="text-sm text-gray-600">{assignment.supervisor.email}</p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    Asignado: {new Date(assignment.assigned_at).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnassign(
                                                assignment.id,
                                                `${assignment.supervisor.last_name} ${assignment.supervisor.first_name}`
                                            )}
                                            className="text-red-600 hover:bg-red-50 hover:border-red-200"
                                        >
                                            Desasignar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Formulario para agregar nuevo supervisor */}
                    {canAddMore && (
                        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-800">Agregar Nuevo Supervisor</span>
                            </div>

                            {/* Seleccionar supervisor */}
                            <div className="space-y-2">
                                <Label htmlFor="supervisor" className="text-sm font-medium">
                                    Seleccionar Supervisor
                                </Label>
                                <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un supervisor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSupervisors.length > 0 ? (
                                            availableSupervisors.map((supervisor) => {
                                                const assignments = supervisorAssignments[supervisor.id];

                                                return (
                                                    <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {supervisor.last_name} {supervisor.first_name}
                                                            </span>
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
                                                Todos los supervisores ya están asignados
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

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

                            <Button
                                type="submit"
                                disabled={!selectedSupervisorId || isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    'Agregar Supervisor'
                                )}
                            </Button>
                        </form>
                    )}

                    {!canAddMore && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                Este zonal ya tiene el máximo de {maxSupervisors} supervisores asignados. 
                                Desasigna uno para poder agregar otro.
                            </p>
                        </div>
                    )}

                    {currentSupervisors.length === 0 && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <p className="text-sm text-gray-600">
                                Este zonal no tiene supervisores asignados aún.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
