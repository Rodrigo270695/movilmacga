import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState, FormEvent, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface RoleFormProps {
    isOpen: boolean;
    onClose: () => void;
    role?: Role | null;
}

export function RoleForm({ isOpen, onClose, role }: RoleFormProps) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Resetear formulario cuando cambia el rol o se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            if (role) {
                // Modo edición
                setFormData({
                    name: role.name,
                });
            } else {
                // Modo creación
                setFormData({
                    name: '',
                });
            }
            setErrors({});
        }
    }, [isOpen, role]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        if (!formData.name.trim()) {
            setErrors({ name: 'El nombre del rol es requerido' });
            setIsSubmitting(false);
            return;
        }

        const url = role 
            ? route('admin.roles.update', role.id)
            : route('admin.roles.store');

        const method = role ? 'patch' : 'post';

        router[method](url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                const action = role ? 'actualizado' : 'creado';
                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Rol ${action} exitosamente.`,
                    duration: 4000
                });
                handleClose();
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Por favor corrige los errores en el formulario.',
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
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="sm:max-w-md max-w-[95vw] mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-left pb-2">
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {role 
                            ? 'Modifica el nombre del rol. Los permisos se gestionan por separado.'
                            : 'Crea un nuevo rol. Después podrás asignar permisos desde la tabla.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nombre del Rol
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Editor, Supervisor, Gestor..."
                            className={`${errors.name 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            disabled={isSubmitting}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
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
                            type="submit"
                            disabled={isSubmitting || !formData.name.trim()}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{role ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <span>{role ? 'Actualizar Rol' : 'Crear Rol'}</span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
