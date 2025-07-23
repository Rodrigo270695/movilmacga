import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface Zonal {
    id: number;
    name: string;
    status?: boolean | number;
    created_at: string;
}

interface ZonalFormProps {
    isOpen: boolean;
    onClose: () => void;
    zonal?: Zonal | null;
}

export function ZonalForm({ isOpen, onClose, zonal }: ZonalFormProps) {
    const isEditing = !!zonal;
    const { addToast } = useToast();

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
    });

    // Resetear y cargar datos cuando cambia el zonal
    useEffect(() => {
        if (isOpen) {
            if (isEditing && zonal) {
                setData({
                    name: zonal.name || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, isEditing, zonal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                const action = isEditing ? 'actualizado' : 'creado';
                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Zonal ${action} exitosamente.`,
                    duration: 4000
                });
                onClose();
                reset();
            },
            onError: (errors: any) => {
                addToast({
                    type: 'error',
                    title: 'Error de validación',
                    message: 'Por favor, revisa los datos ingresados.',
                    duration: 4000
                });
            }
        };

        if (isEditing && zonal) {
            patch(route('dcs.zonales.update', zonal.id), options);
        } else {
            post(route('dcs.zonales.store'), options);
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
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Zonal' : 'Crear Nuevo Zonal'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        {/* Campo Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Nombre del Zonal <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Ingresa el nombre del zonal"
                                maxLength={30}
                                autoComplete="off"
                                disabled={processing}
                            />
                            <InputError message={errors.name} className="mt-1" />
                            <div className="text-xs text-gray-500">
                                Máximo 30 caracteres ({data.name.length}/30)
                            </div>
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
                            disabled={processing || !data.name.trim()}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {isEditing ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    {isEditing ? 'Actualizar Zonal' : 'Crear Zonal'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
 