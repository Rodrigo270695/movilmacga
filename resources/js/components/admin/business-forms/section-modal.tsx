import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Save, Layers } from 'lucide-react';

interface FormSection {
    id?: number;
    name: string;
    description?: string;
    is_active: boolean;
    order_index: number;
}

interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    section?: FormSection | null;
    formId: number;
}

export function SectionModal({ isOpen, onClose, section, formId }: SectionModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<any>({});

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            if (section) {
                // Modo edición
                setFormData({
                    name: section.name,
                    description: section.description || '',
                    is_active: section.is_active,
                });
            } else {
                // Modo creación
                setFormData({
                    name: '',
                    description: '',
                    is_active: true,
                });
            }
            setErrors({});
        } else {
            setIsSubmitting(false);
        }
    }, [isOpen, section]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (section) {
            // Actualizar sección existente
            router.patch(route('admin.business-forms.sections.update', { businessForm: formId, section: section.id }), formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Sección actualizada',
                        message: 'La sección ha sido actualizada exitosamente.',
                        duration: 3000
                    });
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    addToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo actualizar la sección. Verifica los datos ingresados.',
                        duration: 4000
                    });
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false)
            });
        } else {
            // Crear nueva sección
            router.post(route('admin.business-forms.sections.store', formId), formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Sección creada',
                        message: 'La sección ha sido creada exitosamente.',
                        duration: 3000
                    });
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    addToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo crear la sección. Verifica los datos ingresados.',
                        duration: 4000
                    });
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false)
            });
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl w-full mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <Layers className="w-4 h-4 text-blue-600" />
                        </div>
                        {section ? 'Editar Sección' : 'Crear Nueva Sección'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {section
                            ? 'Modifica la información de la sección del formulario'
                            : 'Crea una nueva sección para organizar los campos del formulario'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre de la sección */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nombre de la Sección <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ej: Información General, Detalles del Producto, etc."
                            className="w-full"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Descripción
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe el propósito de esta sección..."
                            rows={3}
                            className="w-full"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Estado activo */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                                Estado de la Sección
                            </Label>
                            <p className="text-xs text-gray-500">
                                {formData.is_active
                                    ? 'La sección estará disponible para agregar campos'
                                    : 'La sección estará desactivada temporalmente'
                                }
                            </p>
                        </div>
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{section ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    <span>{section ? 'Actualizar Sección' : 'Crear Sección'}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
