import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { AlertTriangle, CircuitBoard, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal_id: number;
    created_at: string;
}

interface Zonal {
    id: number;
    name: string;
}

interface ConfirmToggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    circuit: Circuit | null;
    zonal: Zonal;
    isGlobalView?: boolean;
}

export function ConfirmToggleModal({ isOpen, onClose, circuit, zonal, isGlobalView = false }: ConfirmToggleModalProps) {
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!circuit) return null;

    const isActive = circuit.status !== false && circuit.status !== 0 && circuit.status !== null;
    const newStatus = !isActive;

    const handleConfirm = () => {
        setIsProcessing(true);

        // Usar ruta global o jerárquica según el contexto
        const routeName = isGlobalView
            ? 'dcs.circuits.toggle-status'
            : 'dcs.zonales.circuits.toggle-status';

        const routeParams = isGlobalView
            ? circuit.id
            : [zonal.id, circuit.id];

        router.patch(
            route(routeName, routeParams),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: '¡Estado actualizado!',
                        message: `El circuito "${circuit.name}" ha sido ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
                        duration: 4000
                    });
                    onClose();
                },
                onError: () => {
                    addToast({
                        type: 'error',
                        title: 'Error',
                        message: `No se pudo ${newStatus ? 'activar' : 'desactivar'} el circuito. Inténtalo de nuevo.`,
                        duration: 5000
                    });
                },
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const handleClose = () => {
        if (!isProcessing) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md w-[95vw] sm:w-full mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        Confirmar Cambio de Estado
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Esta acción cambiará el estado del circuito seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del circuito */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                <CircuitBoard className="w-4 h-4 text-teal-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{circuit.name}</h4>
                                <p className="text-xs text-gray-500">Código: {circuit.code}</p>
                            </div>
                        </div>

                        <div className="text-xs text-gray-600">
                            <p><span className="font-medium">Zonal:</span> {zonal.name}</p>

                        </div>
                    </div>

                    {/* Estado actual y nuevo */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Estado actual:</span>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                isActive
                                    ? 'text-green-700 bg-green-100 border border-green-200'
                                    : 'text-red-700 bg-red-100 border border-red-200'
                            }`}>
                                {isActive ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        Activo
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-3 h-3" />
                                        Inactivo
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="text-gray-400 text-sm">→</div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Nuevo estado:</span>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                newStatus
                                    ? 'text-green-700 bg-green-100 border border-green-200'
                                    : 'text-red-700 bg-red-100 border border-red-200'
                            }`}>
                                {newStatus ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        Activo
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-3 h-3" />
                                        Inactivo
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Consideraciones importantes:</p>
                                <ul className="text-xs space-y-1 text-yellow-700">
                                    {newStatus ? (
                                        <>
                                            <li>• El circuito será activado y estará disponible en el sistema</li>
                                            <li>• Podrá ser utilizado en operaciones normales</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>• El circuito será desactivado temporalmente</li>
                                            <li>• No estará disponible para nuevas operaciones</li>
                                            <li>• Los datos históricos se mantienen intactos</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className={`w-full sm:w-auto cursor-pointer order-1 sm:order-2 ${
                            newStatus
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <span>{newStatus ? 'Activar Circuito' : 'Desactivar Circuito'}</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
