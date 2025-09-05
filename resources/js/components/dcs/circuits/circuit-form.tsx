import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { router, useForm } from '@inertiajs/react';
import { CircuitBoard, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal_id: number;
    created_at: string;
}

interface Zonal {
    id: number;
    name: string;
}

interface CircuitFormProps {
    isOpen: boolean;
    onClose: () => void;
    circuit?: Circuit | null;
    zonal?: Zonal | null;
    zonales?: Zonal[] | null;
    isGlobalView?: boolean;
}

export function CircuitForm({ isOpen, onClose, circuit, zonal, zonales, isGlobalView = false }: CircuitFormProps) {
    const { addToast } = useToast();
    const isEditing = !!circuit;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        zonal_id: zonal?.id || (circuit?.zonal_id || ''),
    });

    // Cargar datos del circuito para edición
    useEffect(() => {
        if (isOpen && circuit) {
            setData({
                name: circuit.name,
                code: circuit.code,
                zonal_id: circuit.zonal_id,
            });
        } else if (isOpen && !circuit) {
            reset();
        }
    }, [isOpen, circuit]);

    // Limpiar errores cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            clearErrors();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validación adicional para vista global
        if (isGlobalView && !data.zonal_id) {
            addToast({
                type: 'warning',
                title: 'Advertencia',
                message: 'Debes seleccionar un zonal para crear el circuito.',
                duration: 3000
            });
            return;
        }

        const onSuccess = () => {
            addToast({
                type: 'success',
                title: '¡Éxito!',
                message: isEditing
                    ? `Circuito "${data.name}" actualizado correctamente.`
                    : `Circuito "${data.name}" creado correctamente.`,
                duration: 4000
            });
            onClose();
            reset();
        };

        const onError = () => {
            addToast({
                type: 'error',
                title: 'Error',
                message: isEditing
                    ? 'No se pudo actualizar el circuito. Revisa los datos e inténtalo de nuevo.'
                    : 'No se pudo crear el circuito. Revisa los datos e inténtalo de nuevo.',
                duration: 5000
            });
        };

        if (isEditing && circuit) {
            if (isGlobalView) {
                // Vista global: usar ruta global
                patch(route('dcs.circuits.update', circuit.id), {
                    onSuccess,
                    onError,
                    preserveScroll: true,
                });
            } else {
                // Vista jerárquica: usar ruta jerárquica
                patch(route('dcs.zonales.circuits.update', [zonal?.id, circuit.id]), {
                    onSuccess,
                    onError,
                    preserveScroll: true,
                });
            }
        } else {
            if (isGlobalView) {
                // Vista global: usar ruta global
                post(route('dcs.circuits.store'), {
                    onSuccess,
                    onError,
                    preserveScroll: true,
                });
            } else {
                // Vista jerárquica: usar ruta jerárquica
                post(route('dcs.zonales.circuits.store', zonal?.id), {
                    onSuccess,
                    onError,
                    preserveScroll: true,
                });
            }
        }
    };

    const handleClose = () => {
        if (!processing) {
            onClose();
            reset();
        }
    };

    const generateSampleCode = () => {
        if (!data.name) {
            addToast({
                type: 'warning',
                title: 'Advertencia',
                message: 'Primero ingresa un nombre para generar el código.',
                duration: 3000
            });
            return;
        }

        if (isGlobalView && !data.zonal_id) {
            addToast({
                type: 'warning',
                title: 'Advertencia',
                message: 'Primero selecciona un zonal para generar el código.',
                duration: 3000
            });
            return;
        }

        // Generar código basado en el nombre del zonal y del circuito
        let zonalName = '';
        if (isGlobalView) {
            const selectedZonal = zonales?.find(z => z.id === Number(data.zonal_id));
            zonalName = selectedZonal?.name || 'ZN';
        } else {
            zonalName = zonal?.name || 'ZN';
        }

        const zonalPrefix = zonalName.substring(0, 2).toUpperCase();
        const circuitPrefix = data.name.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');

        const suggestedCode = `${zonalPrefix}${circuitPrefix}${randomNum}`;

        setData('code', suggestedCode);

        addToast({
            type: 'info',
            title: 'Código generado',
            message: `Se generó el código: ${suggestedCode}. Puedes modificarlo si lo deseas.`,
            duration: 4000
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md w-[95vw] sm:w-full mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                            <CircuitBoard className="w-4 h-4 text-teal-600" />
                        </div>
                        {isEditing ? 'Editar Circuito' : 'Crear Nuevo Circuito'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {isEditing
                            ? `Modifica los datos del circuito "${circuit?.name}".`
                            : isGlobalView
                                ? 'Completa los datos para crear un nuevo circuito.'
                                : `Completa los datos para crear un nuevo circuito en el zonal ${zonal?.name || 'seleccionado'}.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campo Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nombre del Circuito <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={`w-full ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder="Ej: Circuito Centro, Circuito Norte"
                            maxLength={25}
                            disabled={processing}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <span>⚠️</span>
                                {errors.name}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            Máximo 25 caracteres. Ejemplo: "Circuito Centro"
                        </p>
                    </div>

                    {/* Campo Código */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                                Código del Circuito <span className="text-red-500">*</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateSampleCode}
                                disabled={processing}
                                className="text-xs h-7 px-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                            >
                                🎲 Generar
                            </Button>
                        </div>
                        <Input
                            id="code"
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            className={`w-full font-mono ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder="Ej: NOCEN001, SUCIR002"
                            maxLength={25}
                            disabled={processing}
                        />
                        {errors.code && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <span>⚠️</span>
                                {errors.code}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            Máximo 25 caracteres. Debe ser único en todo el sistema.
                        </p>
                    </div>

                    {/* Zonal Selection/Info */}
                    {isGlobalView ? (
                        <div className="space-y-2">
                            <Label htmlFor="zonal_id" className="text-sm font-medium text-gray-700">
                                Zonal *
                            </Label>
                            <Select
                                value={data.zonal_id?.toString() || ''}
                                onValueChange={(value) => setData('zonal_id', Number(value))}
                                disabled={processing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un zonal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(zonales) && zonales.length > 0 ? (
                                        zonales.map((zonalOption) => (
                                            <SelectItem key={zonalOption.id} value={zonalOption.id.toString()}>
                                                {zonalOption.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="" disabled>
                                            No hay zonales disponibles
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.zonal_id && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <span>⚠️</span>
                                    {errors.zonal_id}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Selecciona el zonal al que pertenecerá este circuito.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Zonal Asignado</h4>
                            <p className="text-sm text-gray-600">{zonal?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Este circuito pertenecerá al zonal seleccionado.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                            disabled={processing || !data.name.trim() || !data.code.trim()}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2"
                        >
                            {processing ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{isEditing ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <span>{isEditing ? 'Actualizar Circuito' : 'Crear Circuito'}</span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
