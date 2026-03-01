import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useToast } from '@/components/ui/toast';

interface Operator {
    id: number;
    name: string;
    description?: string | null;
    status?: boolean;
    created_at: string;
}

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    operator: Operator | null;
}

export function ConfirmDeleteModal({ isOpen, onClose, operator }: ConfirmDeleteModalProps) {
    const { addToast } = useToast();

    const handleDelete = () => {
        if (!operator) return;

        router.delete(route('dcs.operators.destroy', operator.id), {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: 'Eliminado',
                    message: `Operador "${operator.name}" eliminado correctamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo eliminar el operador. Inténtalo de nuevo.',
                    duration: 4000
                });
            }
        });
    };

    if (!operator) return null;

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
                        <div className="p-2 rounded-full bg-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        Eliminar operador
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="font-medium text-gray-900">{operator.name}</div>
                        {operator.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{operator.description}</div>
                        )}
                    </div>

                    <p className="text-sm text-gray-600">
                        ¿Estás seguro de que deseas <span className="font-medium text-red-600">eliminar</span> este operador?
                        Esta acción no se puede deshacer.
                    </p>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white cursor-pointer order-1 sm:order-2"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
