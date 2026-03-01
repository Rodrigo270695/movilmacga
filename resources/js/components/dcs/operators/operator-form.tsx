import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface Operator {
    id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    status?: boolean;
    created_at: string;
}

interface OperatorFormProps {
    isOpen: boolean;
    onClose: () => void;
    operator?: Operator | null;
}

export function OperatorForm({ isOpen, onClose, operator }: OperatorFormProps) {
    const isEditing = !!operator;
    const { addToast } = useToast();

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        color: '#6366f1',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing && operator) {
                setData({
                    name: operator.name || '',
                    description: operator.description || '',
                    color: operator.color || '#6366f1',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, isEditing, operator]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const currentUrl = new URL(window.location.href);
        const preservedQueryParams = currentUrl.search;

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                const action = isEditing ? 'actualizado' : 'creado';
                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Operador ${action} exitosamente.`,
                    duration: 4000
                });
                onClose();
                reset();

                const targetUrl = route('dcs.operators.index') + preservedQueryParams;
                router.get(targetUrl, {}, {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['operators', 'filters']
                });
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error de validación',
                    message: 'Por favor, revisa los datos ingresados.',
                    duration: 4000
                });
            }
        };

        if (isEditing && operator) {
            patch(route('dcs.operators.update', operator.id), options);
        } else {
            post(route('dcs.operators.store'), options);
        }
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-lg"
                aria-describedby={undefined}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Operador' : 'Crear Nuevo Operador'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Nombre <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Nombre del operador"
                                maxLength={255}
                                autoComplete="off"
                                disabled={processing}
                            />
                            <InputError message={errors.name} className="mt-1" />
                            <div className="text-xs text-gray-500">
                                Máximo 255 caracteres ({data.name.length}/255)
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                Descripción
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className={`min-h-[80px] ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Descripción opcional"
                                maxLength={500}
                                disabled={processing}
                            />
                            <InputError message={errors.description} className="mt-1" />
                            <div className="text-xs text-gray-500">
                                Máximo 500 caracteres ({(data.description || '').length}/500)
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color" className="text-sm font-medium text-gray-700">
                                Color <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="color"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1 disabled:opacity-50"
                                    disabled={processing}
                                />
                                <Input
                                    type="text"
                                    value={data.color}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === '') setData('color', v || '#6366f1');
                                    }}
                                    className="flex-1 font-mono text-sm max-w-[120px]"
                                    placeholder="#6366f1"
                                    maxLength={7}
                                    disabled={processing}
                                />
                            </div>
                            <InputError message={errors.color} className="mt-1" />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                            className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.name.trim() || !data.color?.trim()}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {isEditing ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    {isEditing ? 'Actualizar Operador' : 'Crear Operador'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
