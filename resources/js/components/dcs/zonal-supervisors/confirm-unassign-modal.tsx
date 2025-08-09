import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, UserX, MapPin, Building2, Calendar, User } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Business {
    id: number;
    name: string;
}

interface ZonalSupervisor {
    id: number;
    assigned_at: string;
    notes?: string;
    supervisor: User;
}

interface Zonal {
    id: number;
    name: string;
    business: Business;
    active_zonal_supervisor?: ZonalSupervisor;
}

interface ConfirmUnassignModalProps {
    isOpen: boolean;
    onClose: () => void;
    zonal?: Zonal | null;
    assignmentId?: number;
}

export function ConfirmToggleModal({ isOpen, onClose, zonal, assignmentId }: ConfirmUnassignModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleConfirm = () => {
        if (!zonal || !assignmentId) return;

        setIsSubmitting(true);

        router.delete(route('dcs.zonal-supervisors.destroy', assignmentId), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Supervisor desasignado!',
                    message: `El supervisor ha sido desasignado del zonal "${zonal.name}" exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo desasignar el supervisor. Inténtalo de nuevo.',
                    duration: 4000
                });
                onClose();
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!zonal || !zonal.active_zonal_supervisor) return null;

    const supervisor = zonal.active_zonal_supervisor.supervisor;

    return (
                <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md max-w-[95vw] mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                aria-describedby={undefined}
            >
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <UserX className="w-6 h-6 text-red-600" />
                    </div>

                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                        Confirmar Desasignación
                    </DialogTitle>
                </DialogHeader>

                {/* Contenido principal del modal */}
                <div className="space-y-4 py-2">
                    {/* Pregunta principal */}
                    <div className="text-sm text-gray-600 text-center">
                        ¿Estás seguro de que deseas <strong className="text-red-600">desasignar</strong> al supervisor{' '}
                        <strong className="text-blue-600">"{supervisor.first_name} {supervisor.last_name}"</strong> del zonal{' '}
                        <strong className="text-blue-600">"{zonal.name}"</strong>?
                    </div>

                    {/* Información del zonal */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">Información del Zonal</span>
                        </div>

                        <div className="space-y-2 ml-6">
                            <div className="text-xs text-gray-500">
                                <span>Zonal:</span>{' '}
                                <span className="font-medium text-gray-700">{zonal.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                                <span>Negocio:</span>{' '}
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-1">
                                    {zonal.business?.name || 'Sin negocio'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Información del supervisor */}
                    <div className="bg-red-50 rounded-lg p-3 space-y-3 border border-red-200">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">Supervisor a Desasignar</span>
                        </div>

                        <div className="space-y-2 ml-6">
                            <div className="text-xs text-gray-600">
                                <span>Nombre:</span>{' '}
                                <span className="font-medium text-gray-800">{supervisor.first_name} {supervisor.last_name}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                                <span>Email:</span>{' '}
                                <span className="font-medium text-gray-800">{supervisor.email}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                                <span>Asignado desde:</span>{' '}
                                <span className="font-medium text-gray-800">{formatDate(zonal.active_zonal_supervisor.assigned_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-amber-700">
                                <div className="font-medium mb-1">¡Atención!</div>
                                <div>
                                    Al desasignar este supervisor, el zonal quedará sin supervisión directa.{' '}
                                    Podrás asignar un nuevo supervisor cuando sea necesario.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto cursor-pointer order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <span>Desasignar Supervisor</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
