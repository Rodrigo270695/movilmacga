import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Route,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    CircuitBoard
} from 'lucide-react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    circuit_id: number;
    created_at: string;
    circuit?: {
        id: number;
        name: string;
        zonal?: {
            id: number;
            name: string;
        };
    };
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface ConfirmToggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: RouteModel | null;
    circuit?: Circuit;
    isGlobalView?: boolean;
}

export function ConfirmToggleModal({ isOpen, onClose, route: routeModel, circuit, isGlobalView = false }: ConfirmToggleModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!routeModel) return null;

    const currentStatus = routeModel.status === true || routeModel.status === 1;
    const newStatus = !currentStatus;
    const statusText = currentStatus ? 'desactivar' : 'activar';
    const statusColor = currentStatus ? 'text-red-600' : 'text-green-600';

    const handleConfirm = () => {
        setIsSubmitting(true);

                const routeName = isGlobalView ? 'dcs.routes.toggle-status' : 'dcs.zonales.circuits.routes.toggle-status';
        const routeParams = isGlobalView
            ? { route: routeModel.id }
            : [circuit?.zonal?.id, circuit?.id, routeModel.id];

        router.patch(route(routeName, routeParams), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: `¡Ruta ${newStatus ? 'activada' : 'desactivada'}!`,
                    message: `La ruta "${routeModel.name}" se ${newStatus ? 'activó' : 'desactivó'} correctamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al cambiar estado:', errors);
                addToast({
                    type: 'error',
                    title: 'Error al cambiar estado',
                    message: 'Hubo un problema al cambiar el estado de la ruta. Inténtalo nuevamente.',
                    duration: 4000
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const getCurrentStatusBadge = () => {
        if (currentStatus) {
            return (
                <Badge className="text-green-700 bg-green-50 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Activo
                </Badge>
            );
        }
        return (
            <Badge className="text-red-700 bg-red-50 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                Inactivo
            </Badge>
        );
    };

    const getNewStatusBadge = () => {
        if (newStatus) {
            return (
                <Badge className="text-green-700 bg-green-50 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Activo
                </Badge>
            );
        }
        return (
            <Badge className="text-red-700 bg-red-50 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                Inactivo
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        Confirmar Cambio de Estado
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de <span className={statusColor + " font-medium"}>{statusText}</span> la siguiente ruta.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información de la ruta */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Route className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{routeModel.name}</h4>
                                <p className="text-sm text-gray-500">Código: {routeModel.code}</p>
                            </div>
                        </div>

                        {/* Información del circuito */}
                        <div className="border-t pt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CircuitBoard className="w-4 h-4" />
                                <span className="font-medium">Circuito:</span>
                                {isGlobalView && routeModel.circuit ? (
                                    <span>
                                        {routeModel.circuit.name}
                                        {routeModel.circuit.zonal && ` (${routeModel.circuit.zonal.name})`}
                                    </span>
                                ) : circuit ? (
                                    <span>
                                        {circuit.name}
                                        {circuit.zonal && ` (${circuit.zonal.name})`}
                                    </span>
                                ) : (
                                    <span>No disponible</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cambio de estado */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Cambio de Estado</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Actual:</span>
                                {getCurrentStatusBadge()}
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Nuevo:</span>
                                {getNewStatusBadge()}
                            </div>
                        </div>
                    </div>

                    {/* Consideraciones importantes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Consideraciones importantes:</p>
                                <ul className="space-y-1 text-xs">
                                    {newStatus ? (
                                        <>
                                            <li>• La ruta será visible y utilizable en el sistema</li>
                                            <li>• Se habilitarán todas las funciones relacionadas</li>
                                            <li>• Los usuarios podrán acceder a esta ruta</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>• La ruta quedará oculta en las listas principales</li>
                                            <li>• Se deshabilitarán las funciones relacionadas</li>
                                            <li>• Los datos se conservarán para reactivación futura</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`cursor-pointer ${newStatus
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                        {isSubmitting ? (
                            'Procesando...'
                        ) : (
                            `${newStatus ? 'Activar' : 'Desactivar'} Ruta`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
