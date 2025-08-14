import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Save, X, FileText, Building } from 'lucide-react';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface BusinessForm {
    id?: number;
    name: string;
    description?: string;
    is_active: boolean;
    business_id: number;
    settings?: any;
}

interface BusinessFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    form?: BusinessForm | null;
    businesses: Business[];
    preselectedBusinessId?: number;
}

export function BusinessFormModal({ isOpen, onClose, form, businesses, preselectedBusinessId }: BusinessFormModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        business_id: preselectedBusinessId ? preselectedBusinessId.toString() : '',
        name: '',
        description: '',
        is_active: true,
        settings: {},
    });
    const [errors, setErrors] = useState<any>({});

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            if (form) {
                // Modo edición
                setFormData({
                    business_id: form.business_id.toString(),
                    name: form.name,
                    description: form.description || '',
                    is_active: form.is_active,
                    settings: form.settings || {},
                });
            } else {
                // Modo creación
                setFormData({
                    business_id: preselectedBusinessId ? preselectedBusinessId.toString() : '',
                    name: '',
                    description: '',
                    is_active: true,
                    settings: {},
                });
            }
            setErrors({});
        } else {
            setIsSubmitting(false);
        }
    }, [isOpen, form, preselectedBusinessId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (form) {
            // Actualizar formulario existente
            router.patch(route('admin.business-forms.update', form.id), formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Formulario actualizado',
                        message: 'El formulario ha sido actualizado exitosamente.',
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
                        message: 'No se pudo actualizar el formulario. Verifica los datos ingresados.',
                        duration: 4000
                    });
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false)
            });
        } else {
            // Crear nuevo formulario
            router.post(route('admin.business-forms.store'), formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Formulario creado',
                        message: 'El formulario ha sido creado exitosamente.',
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
                        message: 'No se pudo crear el formulario. Verifica los datos ingresados.',
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
            <DialogContent className="max-w-2xl w-full mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        {form ? 'Editar Formulario' : 'Crear Nuevo Formulario'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {form
                            ? 'Modifica la información del formulario dinámico'
                            : 'Crea un nuevo formulario personalizado para el negocio seleccionado'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Negocio */}
                    <div className="space-y-2">
                        <Label htmlFor="business_id" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            Negocio <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <select
                            id="business_id"
                            value={formData.business_id}
                            onChange={(e) => setFormData({...formData, business_id: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={!!preselectedBusinessId}
                        >
                            <option value="">Selecciona un negocio</option>
                            {businesses.map((business) => (
                                <option key={business.id} value={business.id}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                        {errors.business_id && (
                            <p className="text-sm text-red-600">{errors.business_id}</p>
                        )}
                    </div>

                    {/* Nombre del formulario */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nombre del Formulario <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ej: Encuesta de Satisfacción, Checklist de Visita, etc."
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
                            placeholder="Describe el propósito y contenido del formulario..."
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
                                Estado del Formulario
                            </Label>
                            <p className="text-xs text-gray-500">
                                {formData.is_active
                                    ? 'El formulario estará disponible para su uso'
                                    : 'El formulario estará desactivado temporalmente'
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
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{form ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    <span>{form ? 'Actualizar Formulario' : 'Crear Formulario'}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
