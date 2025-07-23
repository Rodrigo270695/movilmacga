import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    status?: boolean | number;
    roles: any[];
}

interface ConfirmToggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
}

export function ConfirmToggleModal({ isOpen, onClose, user }: ConfirmToggleModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getButtonConfig = (status?: boolean | number) => {
        // Verificar si está inactivo (false, 0, o null)
        if (status === false || status === 0 || status === null) {
            return {
                confirmText: 'Activar',
                className: 'bg-green-600 hover:bg-green-700 text-white'
            };
        }
        return {
            confirmText: 'Desactivar', 
            className: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
    };

    const isActive = (status?: boolean | number): boolean => {
        return status === true || status === 1;
    };

    const handleConfirm = () => {
        if (!user) return;

        setIsSubmitting(true);

        router.patch(route('admin.users.toggle-status', user.id), {}, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                const newStatus = !isActive(user.status);
                const statusText = newStatus ? 'activado' : 'desactivado';
                
                addToast({
                    type: 'success',
                    title: '¡Estado actualizado!',
                    message: `El usuario "${user.name}" ha sido ${statusText} exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo cambiar el estado del usuario. Inténtalo de nuevo.',
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

    if (!user) return null;

    const buttonConfig = getButtonConfig(user.status);
    const currentStatus = isActive(user.status) ? 'activo' : 'inactivo';
    const newStatus = isActive(user.status) ? 'inactivo' : 'activo';
    const action = isActive(user.status) ? 'desactivar' : 'activar';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="sm:max-w-md max-w-[95vw] mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                aria-describedby={undefined}
            >
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                        Confirmar cambio de estado
                    </DialogTitle>
                </DialogHeader>

                {/* Contenido principal del modal */}
                <div className="space-y-4 py-2">
                    {/* Pregunta principal */}
                    <div className="text-sm text-gray-600 text-center">
                        ¿Estás seguro de que deseas <strong className="text-gray-900">{action}</strong> al usuario{' '}
                        <strong className="text-blue-600">"{user.name}"</strong>?
                    </div>
                    {/* Información del usuario */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="text-xs text-gray-500">
                            <span>Usuario:</span>{' '}
                            <span className="font-medium text-gray-700">@{user.username}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            <span>Email:</span>{' '}
                            <span className="font-medium text-gray-700">{user.email}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            <span>Estado actual:</span>{' '}
                            <span className={`font-medium ${
                                isActive(user.status) ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {currentStatus}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            <span>Nuevo estado:</span>{' '}
                            <span className={`font-medium ${
                                !isActive(user.status) ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {newStatus}
                            </span>
                        </div>
                    </div>

                    {/* Advertencia sobre roles asignados */}
                    {user.roles && user.roles.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-700">
                                    <div className="font-medium mb-1">¡Atención!</div>
                                    <div>
                                        Este usuario tiene <strong>{user.roles.length}</strong>{' '}
                                        {user.roles.length === 1 ? 'rol asignado' : 'roles asignados'}.{' '}
                                        {isActive(user.status) 
                                            ? 'Al desactivarlo, no podrá acceder al sistema.'
                                            : 'Al activarlo, recuperará el acceso según sus roles.'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                        className={`w-full sm:w-auto cursor-pointer order-1 sm:order-2 ${buttonConfig.className}`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <span>{buttonConfig.confirmText} Usuario</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 