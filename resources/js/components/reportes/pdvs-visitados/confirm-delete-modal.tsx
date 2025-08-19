import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
    AlertTriangle,
    Trash2,
    MapPin,
    User,
    Calendar,
    Clock
} from 'lucide-react';

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
    classification: string;
    status: string;
}

interface PdvVisit {
    id: number;
    check_in_at: string;
    check_out_at?: string;
    visit_status: 'in_progress' | 'completed' | 'cancelled';
    duration_minutes?: number;
    distance_to_pdv?: number;
    latitude: number;
    longitude: number;
    user: User;
    pdv: Pdv;
}

interface Props {
    open: boolean;
    onClose: () => void;
    visita: PdvVisit | null;
}

export function ConfirmDeleteModal({ open, onClose, visita }: Props) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si visita es null, no mostrar el modal
    if (!visita) {
        return null;
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return 'N/A';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDistance = (distance?: number) => {
        if (!distance) return 'N/A';

        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)}km`;
        }
        return `${Math.round(distance)}m`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_progress':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        En Progreso
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        Completada
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                        Cancelada
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        Desconocido
                    </Badge>
                );
        }
    };

    const handleConfirm = () => {
        setIsSubmitting(true);

        router.delete(`/reportes/pdvs-visitados/${visita.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Visita eliminada!',
                    message: `La visita al PDV "${visita.pdv.point_name}" ha sido eliminada exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al eliminar visita:', errors);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo eliminar la visita. Inténtalo de nuevo.',
                    duration: 4000
                });
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="w-5 h-5" />
                        Confirmar Eliminación
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de eliminar esta visita. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información de la visita */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* Fecha y hora */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">
                                {formatDateTime(visita.check_in_at)}
                            </span>
                        </div>

                        {/* Vendedor */}
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">
                                {visita.user.first_name} {visita.user.last_name}
                                <span className="text-gray-500 ml-1">({visita.user.username})</span>
                            </span>
                        </div>

                        {/* PDV */}
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">
                                {visita.pdv.point_name}
                                <span className="text-gray-500 ml-1">• {visita.pdv.client_name}</span>
                            </span>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600">Estado:</div>
                            {getStatusBadge(visita.visit_status)}
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <div>
                                    <div className="text-xs text-gray-500">Duración</div>
                                    <div className="text-sm font-medium">{formatDuration(visita.duration_minutes)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <div>
                                    <div className="text-xs text-gray-500">Distancia</div>
                                    <div className="text-sm font-medium">{formatDistance(visita.distance_to_pdv)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-medium">¡Atención!</p>
                            <p>
                                Esta acción eliminará permanentemente la visita y todas sus respuestas de formularios asociadas.
                                No podrás recuperar esta información.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Eliminando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Eliminar Visita
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
