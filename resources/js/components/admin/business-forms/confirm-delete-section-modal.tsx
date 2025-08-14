import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
    AlertTriangle,
    Trash2,
    Layers,
    FileText,
    Building
} from 'lucide-react';

interface FormSection {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    order_index: number;
    fields: any[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    section: FormSection | null;
    formId: number;
}

export function ConfirmDeleteSectionModal({ open, onClose, section, formId }: Props) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si section es null, no mostrar el modal
    if (!section) {
        return null;
    }

    const handleConfirm = () => {
        setIsSubmitting(true);

        router.delete(route('admin.business-forms.sections.destroy', { businessForm: formId, section: section.id }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: '¡Sección eliminada!',
                    message: `La sección "${section.name}" ha sido eliminada exitosamente.`,
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error al eliminar sección:', errors);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo eliminar la sección. Inténtalo de nuevo.',
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
                        Estás a punto de eliminar esta sección. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información de la sección */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{section.name}</span>
                        </div>

                        {section.description && (
                            <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{section.description}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Badge
                                variant={section.is_active ? "default" : "secondary"}
                                className={`text-xs ${
                                    section.is_active
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                                {section.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                • {section.fields.length} campos
                            </span>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-rose-800">
                            <p className="font-medium">¡Atención!</p>
                            <p>
                                Al eliminar esta sección, también se eliminarán todos los campos asociados ({section.fields.length} campos).
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
                                Eliminar Sección
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
