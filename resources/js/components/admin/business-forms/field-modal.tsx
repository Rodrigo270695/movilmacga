import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Save, Type } from 'lucide-react';

interface FormField {
    id?: number;
    field_type: string;
    label: string;
    placeholder?: string;
    is_required: boolean;
    is_active: boolean;
    order_index: number;
    options?: string[];
    min_value?: number;
    max_value?: number;
    file_types?: string;
    max_file_size?: number;
}

interface FieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    field?: FormField | null;
    formId: number;
    sectionId: number;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Texto', description: 'Campo de texto simple' },
    { value: 'number', label: 'Número', description: 'Campo numérico' },
    { value: 'select', label: 'Selección', description: 'Lista desplegable' },
    { value: 'checkbox', label: 'Casilla', description: 'Casilla de verificación' },
    { value: 'image', label: 'Imagen', description: 'Subir imagen' },
    { value: 'pdf', label: 'PDF', description: 'Subir archivo PDF' },
    { value: 'location', label: 'Ubicación', description: 'Capturar ubicación GPS' },
    { value: 'signature', label: 'Firma', description: 'Firma digital' },
];

export function FieldModal({ isOpen, onClose, field, formId, sectionId }: FieldModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        field_type: 'text',
        label: '',
        placeholder: '',
        is_required: false,
        is_active: true,
        options: [] as string[],
        min_value: undefined as number | undefined,
        max_value: undefined as number | undefined,
        file_types: '',
        max_file_size: undefined as number | undefined,
    });
    const [errors, setErrors] = useState<any>({});
    const [newOption, setNewOption] = useState('');

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            if (field) {
                // Modo edición
                setFormData({
                    field_type: field.field_type,
                    label: field.label,
                    placeholder: field.placeholder || '',
                    is_required: field.is_required,
                    is_active: field.is_active,
                    options: field.options || [],
                    min_value: field.min_value,
                    max_value: field.max_value,
                    file_types: field.file_types || '',
                    max_file_size: field.max_file_size,
                });
            } else {
                // Modo creación
                setFormData({
                    field_type: 'text',
                    label: '',
                    placeholder: '',
                    is_required: false,
                    is_active: true,
                    options: [],
                    min_value: undefined,
                    max_value: undefined,
                    file_types: '',
                    max_file_size: undefined,
                });
            }
            setErrors({});
            setNewOption('');
        } else {
            setIsSubmitting(false);
        }
    }, [isOpen, field]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (field) {
            // Actualizar campo existente
            router.patch(route('admin.business-forms.fields.update', { businessForm: formId, field: field.id }), formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Campo actualizado',
                        message: 'El campo ha sido actualizado exitosamente.',
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
                        message: 'No se pudo actualizar el campo. Verifica los datos ingresados.',
                        duration: 4000
                    });
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false)
            });
        } else {
            // Crear nuevo campo
            router.post(route('admin.business-forms.fields.store', formId), {
                ...formData,
                form_section_id: sectionId,
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: 'Campo creado',
                        message: 'El campo ha sido creado exitosamente.',
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
                        message: 'No se pudo crear el campo. Verifica los datos ingresados.',
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

    const addOption = () => {
        if (newOption.trim() && !formData.options.includes(newOption.trim())) {
            setFormData({
                ...formData,
                options: [...formData.options, newOption.trim()]
            });
            setNewOption('');
        }
    };

    const removeOption = (index: number) => {
        setFormData({
            ...formData,
            options: formData.options.filter((_, i) => i !== index)
        });
    };

    const isSelectType = formData.field_type === 'select';
    const isNumberType = formData.field_type === 'number';
    const isFileType = ['image', 'pdf'].includes(formData.field_type);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                            <Type className="w-4 h-4 text-green-600" />
                        </div>
                        {field ? 'Editar Campo' : 'Crear Nuevo Campo'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {field
                            ? 'Modifica la configuración del campo del formulario'
                            : 'Crea un nuevo campo para la sección del formulario'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de campo */}
                    <div className="space-y-2">
                        <Label htmlFor="field_type" className="text-sm font-medium text-gray-700">
                            Tipo de Campo <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select
                            value={formData.field_type}
                            onValueChange={(value) => setFormData({...formData, field_type: value})}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona el tipo de campo" />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{type.label}</span>
                                            <span className="text-xs text-gray-500">{type.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.field_type && (
                            <p className="text-sm text-red-600">{errors.field_type}</p>
                        )}
                    </div>

                    {/* Etiqueta del campo */}
                    <div className="space-y-2">
                        <Label htmlFor="label" className="text-sm font-medium text-gray-700">
                            Etiqueta del Campo <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input
                            id="label"
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({...formData, label: e.target.value})}
                            placeholder="Ej: Nombre del cliente, Cantidad, etc."
                            className="w-full"
                        />
                        {errors.label && (
                            <p className="text-sm text-red-600">{errors.label}</p>
                        )}
                    </div>

                    {/* Placeholder */}
                    <div className="space-y-2">
                        <Label htmlFor="placeholder" className="text-sm font-medium text-gray-700">
                            Texto de Ayuda
                        </Label>
                        <Input
                            id="placeholder"
                            type="text"
                            value={formData.placeholder}
                            onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                            placeholder="Texto que aparecerá como ayuda en el campo"
                            className="w-full"
                        />
                        {errors.placeholder && (
                            <p className="text-sm text-red-600">{errors.placeholder}</p>
                        )}
                    </div>

                    {/* Opciones para campos de selección */}
                    {isSelectType && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                                Opciones de Selección
                            </Label>
                            <div className="space-y-2">
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...formData.options];
                                                newOptions[index] = e.target.value;
                                                setFormData({...formData, options: newOptions});
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeOption(index)}
                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        placeholder="Nueva opción"
                                        className="flex-1"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOption}
                                        disabled={!newOption.trim()}
                                    >
                                        Agregar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuración para campos numéricos */}
                    {isNumberType && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_value" className="text-sm font-medium text-gray-700">
                                    Valor Mínimo
                                </Label>
                                <Input
                                    id="min_value"
                                    type="number"
                                    value={formData.min_value || ''}
                                    onChange={(e) => setFormData({...formData, min_value: e.target.value ? Number(e.target.value) : undefined})}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_value" className="text-sm font-medium text-gray-700">
                                    Valor Máximo
                                </Label>
                                <Input
                                    id="max_value"
                                    type="number"
                                    value={formData.max_value || ''}
                                    onChange={(e) => setFormData({...formData, max_value: e.target.value ? Number(e.target.value) : undefined})}
                                    placeholder="100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Configuración para campos de archivo */}
                    {isFileType && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file_types" className="text-sm font-medium text-gray-700">
                                    Tipos de Archivo Permitidos
                                </Label>
                                <Input
                                    id="file_types"
                                    type="text"
                                    value={formData.file_types}
                                    onChange={(e) => setFormData({...formData, file_types: e.target.value})}
                                    placeholder={formData.field_type === 'image' ? 'jpg,png,gif' : 'pdf'}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500">
                                    Separa los tipos con comas (ej: jpg,png,pdf)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_file_size" className="text-sm font-medium text-gray-700">
                                    Tamaño Máximo (KB)
                                </Label>
                                <Input
                                    id="max_file_size"
                                    type="number"
                                    value={formData.max_file_size || ''}
                                    onChange={(e) => setFormData({...formData, max_file_size: e.target.value ? Number(e.target.value) : undefined})}
                                    placeholder="2048"
                                />
                            </div>
                        </div>
                    )}

                    {/* Estado activo */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                                Estado del Campo
                            </Label>
                            <p className="text-xs text-gray-500">
                                {formData.is_active
                                    ? 'El campo estará disponible en el formulario'
                                    : 'El campo estará desactivado temporalmente'
                                }
                            </p>
                        </div>
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                    </div>

                    {/* Campo requerido */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                                Campo Requerido
                            </Label>
                            <p className="text-xs text-gray-500">
                                {formData.is_required
                                    ? 'El usuario deberá completar este campo obligatoriamente'
                                    : 'El campo será opcional para el usuario'
                                }
                            </p>
                        </div>
                        <Switch
                            checked={formData.is_required}
                            onCheckedChange={(checked) => setFormData({...formData, is_required: checked})}
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
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{field ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    <span>{field ? 'Actualizar Campo' : 'Crear Campo'}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
