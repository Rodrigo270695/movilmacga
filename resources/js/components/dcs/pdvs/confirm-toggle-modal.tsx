import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
    AlertTriangle,
    Power,
    MapPin,
    User,
    Building2
} from 'lucide-react';

interface PdvModel {
    id: number;
    point_name: string;
    client_name: string;
    status: string;
    classification: string;
    route?: {
        name: string;
        circuit?: {
            name: string;
            zonal?: {
                name: string;
            };
        };
    };
}

interface Props {
    open: boolean; // Cambiado de isOpen a open para consistencia
    onClose: () => void;
    pdv: PdvModel | null; // Permitir null
    isGlobalView?: boolean;
}

export function ConfirmToggleModal({ open, onClose, pdv, isGlobalView = false }: Props) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si pdv es null, no mostrar el modal
    if (!pdv) {
        return null;
    }

    const getStatusInfo = (status: string) => {
        const statusConfig = {
            'vende': {
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Vende',
                nextStatus: 'no vende',
                nextLabel: 'No Vende',
                nextColor: 'bg-red-100 text-red-800 border-red-200'
            },
            'no vende': {
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'No Vende',
                nextStatus: 'vende',
                nextLabel: 'Vende',
                nextColor: 'bg-green-100 text-green-800 border-green-200'
            },
            'no existe': {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                label: 'No Existe',
                nextStatus: 'vende',
                nextLabel: 'Vende',
                nextColor: 'bg-green-100 text-green-800 border-green-200'
            },
            'pdv autoactivado': {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                label: 'Autoactivado',
                nextStatus: 'vende',
                nextLabel: 'Vende',
                nextColor: 'bg-green-100 text-green-800 border-green-200'
            },
            'pdv impulsador': {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                label: 'Impulsador',
                nextStatus: 'vende',
                nextLabel: 'Vende',
                nextColor: 'bg-green-100 text-green-800 border-green-200'
            }
        };

        return statusConfig[status as keyof typeof statusConfig] || statusConfig['no vende'];
    };

    const statusInfo = getStatusInfo(pdv.status);

    const handleConfirm = () => {
        setIsSubmitting(true);

        const routeName = isGlobalView ? 'dcs.pdvs' : 'dcs.pdvs';

        router.patch(route(`${routeName}.toggle-status`, pdv.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Estado actualizado!',
                    message: `El estado del PDV "${pdv.point_name}" ha sido cambiado exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al cambiar estado:', errors);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo cambiar el estado del PDV. Inténtalo de nuevo.',
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
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        Confirmar Cambio de Estado
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de cambiar el estado de este PDV. Esta acción se puede revertir.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del PDV */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{pdv.point_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{pdv.client_name}</span>
                        </div>

                        {pdv.route && (
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">
                                    {pdv.route.name}
                                    {pdv.route.circuit && (
                                        <span className="text-gray-500">
                                            {' • '}{pdv.route.circuit.name}
                                            {pdv.route.circuit.zonal && (
                                                <span> • {pdv.route.circuit.zonal.name}</span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Cambio de estado */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Estado actual</p>
                                <Badge className={`${statusInfo.color} text-xs font-medium border`}>
                                    {statusInfo.label}
                                </Badge>
                            </div>

                            <div className="flex items-center">
                                <Power className="w-5 h-5 text-blue-600" />
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Nuevo estado</p>
                                <Badge className={`${statusInfo.nextColor} text-xs font-medium border`}>
                                    {statusInfo.nextLabel}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Importante:</p>
                            <p>
                                El cambio de estado del PDV afectará su disponibilidad en el sistema.
                                Puedes revertir este cambio en cualquier momento.
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
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Cambiando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Power className="w-4 h-4" />
                                Confirmar Cambio
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
