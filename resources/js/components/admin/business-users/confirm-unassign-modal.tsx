import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
    AlertTriangle,
    UserX,
    User,
    Building2,
    Users
} from 'lucide-react';

interface UserModel {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: boolean;
}

interface BusinessModel {
    id: number;
    name: string;
    status: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    user: UserModel | null;
    business: BusinessModel | null;
}

export function ConfirmUnassignModal({ open, onClose, user, business }: Props) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si user o business son null, no mostrar el modal
    if (!user || !business) {
        return null;
    }

    const handleConfirm = () => {
        setIsSubmitting(true);

        router.delete(`/admin/business-users/${business.id}/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Usuario desasignado!',
                    message: `${user.first_name} ${user.last_name} ha sido desasignado del negocio ${business.name} exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al desasignar usuario:', errors);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo desasignar el usuario. Inténtalo de nuevo.',
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
                        <UserX className="w-5 h-5" />
                        Confirmar Desasignación
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de desasignar un usuario de este negocio. Esta acción se puede revertir.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del Usuario */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{user.email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{business.name}</span>
                        </div>
                    </div>

                    {/* Estado del usuario */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Estado actual</p>
                                <Badge
                                    variant={user.status ? "default" : "secondary"}
                                    className={user.status ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                                >
                                    {user.status ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>

                            <div className="flex items-center">
                                <UserX className="w-5 h-5 text-red-600" />
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Después de desasignar</p>
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                    Desasignado
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-medium">Importante:</p>
                            <p>
                                El usuario será desasignado de este negocio específico.
                                Si está asignado a otros negocios, mantendrá esas asignaciones.
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
                                Desasignando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4" />
                                Confirmar Desasignación
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
