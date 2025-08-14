import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
    AlertTriangle,
    Trash2,
    Type,
    FileText,
    Layers
} from 'lucide-react';

interface FormField {
    id: number;
    field_type: string;
    label: string;
    placeholder?: string;
    is_required: boolean;
    is_active: boolean;
    order_index: number;
    form_section_id: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    field: FormField | null;
    formId: number;
}

export function ConfirmDeleteFieldModal({ open, onClose, field, formId }: Props) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si field es null, no mostrar el modal
    if (!field) {
        return null;
    }

    const getFieldTypeIcon = (fieldType: string) => {
        switch (fieldType) {
            case 'text':
                return '📝';
            case 'number':
                return '🔢';
            case 'select':
                return '📋';
            case 'checkbox':
                return '☑️';
            case 'image':
                return '🖼️';
            case 'pdf':
                return '📄';
            case 'location':
                return '📍';
            case 'signature':
                return '✍️';
            default:
                return '📝';
        }
    };

    const getFieldTypeLabel = (fieldType: string) => {
        switch (fieldType) {
            case 'text':
                return 'Texto';
            case 'number':
                return 'Número';
            case 'select':
                return 'Selección';
            case 'checkbox':
                return 'Casilla';
            case 'image':
                return 'Imagen';
            case 'pdf':
                return 'PDF';
            case 'location':
                return 'Ubicación';
            case 'signature':
                return 'Firma';
            default:
                return fieldType;
        }
    };

    const handleConfirm = () => {
        setIsSubmitting(true);

        router.delete(route('admin.business-forms.fields.destroy', { businessForm: formId, field: field.id }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Campo eliminado!',
                    message: `El campo "${field.label}" ha sido eliminado exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al eliminar campo:', errors);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo eliminar el campo. Inténtalo de nuevo.',
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
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                        Confirmar Eliminación
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de eliminar este campo. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del campo */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{getFieldTypeIcon(field.field_type)}</span>
                            <span className="font-medium text-gray-900">{field.label}</span>
                        </div>

                        {field.placeholder && (
                            <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{field.placeholder}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200"
                            >
                                {getFieldTypeLabel(field.field_type)}
                            </Badge>
                            {field.is_required && (
                                <Badge
                                    variant="destructive"
                                    className="text-xs bg-rose-100 text-rose-800 border-rose-200"
                                >
                                    Requerido
                                </Badge>
                            )}
                            <Badge
                                variant={field.is_active ? "default" : "secondary"}
                                className={`text-xs ${
                                    field.is_active
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                                {field.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-rose-800">
                            <p className="font-medium">¡Atención!</p>
                            <p>
                                Al eliminar este campo, se perderán todas las respuestas asociadas.
                                Esta acción es irreversible.
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
                        className="cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Eliminando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Eliminar Campo
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
