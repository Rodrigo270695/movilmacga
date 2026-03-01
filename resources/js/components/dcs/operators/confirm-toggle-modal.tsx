import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Power } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useToast } from '@/components/ui/toast';

interface Operator {
    id: number;
    name: string;
    description?: string | null;
    status?: boolean;
    created_at: string;
}

interface ConfirmToggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    operator: Operator | null;
}

export function ConfirmToggleModal({ isOpen, onClose, operator }: ConfirmToggleModalProps) {
    const { addToast } = useToast();

    const { patch, processing } = useForm();

    const getOperatorStatus = (status?: boolean): boolean => {
        return status ?? false;
    };

    const handleToggle = () => {
        if (!operator) return;

        patch(route('dcs.operators.toggle-status', operator.id), {
            preserveScroll: true,
            onSuccess: () => {
                const currentStatus = getOperatorStatus(operator.status);
                const newStatusText = currentStatus ? 'desactivado' : 'activado';

                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Operador ${newStatusText} exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Hubo un problema al cambiar el estado del operador.',
                    duration: 4000
                });
            }
        });
    };

    if (!operator) return null;

    const isActive = getOperatorStatus(operator.status);
    const actionText = isActive ? 'desactivar' : 'activar';
    const buttonColor = isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-md"
                aria-describedby={undefined}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${isActive ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isActive ? (
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            ) : (
                                <Power className="w-5 h-5 text-green-600" />
                            )}
                        </div>
                        Confirmar {actionText} operador
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">{operator.name}</div>
                                <div className="text-sm text-gray-500">Estado actual:</div>
                            </div>
                            <Badge variant={isActive ? 'success' : 'destructive'}>
                                {isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        {isActive ? (
                            <>
                                ¿Estás seguro de que deseas <span className="font-medium text-red-600">desactivar</span> este operador?
                            </>
                        ) : (
                            <>
                                ¿Estás seguro de que deseas <span className="font-medium text-green-600">activar</span> este operador?
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                        className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleToggle}
                        disabled={processing}
                        className={`w-full sm:w-auto text-white cursor-pointer order-1 sm:order-2 ${buttonColor}`}
                    >
                        {processing ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Power className="w-4 h-4 mr-2" />
                                {actionText.charAt(0).toUpperCase() + actionText.slice(1)}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
