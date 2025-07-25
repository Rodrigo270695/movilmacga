import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Route, Shuffle, X } from 'lucide-react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    circuit_id: number;
    created_at: string;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    status?: boolean | number;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Zonal {
    id: number;
    name: string;
}

interface RouteFormProps {
    isOpen: boolean;
    onClose: () => void;
    route?: RouteModel | null;
    circuit?: Circuit;
    circuits?: Circuit[];
    zonales?: Zonal[];
    isGlobalView?: boolean;
}

export function RouteForm({ isOpen, onClose, route: editingRoute, circuit, circuits = [], zonales = [], isGlobalView = false }: RouteFormProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        circuit_id: circuit?.id?.toString() || ''
    });

    const [selectedZonal, setSelectedZonal] = useState<string>('');

    // Filtrar circuitos por zonal seleccionado (solo en vista global)
    const filteredCircuits = isGlobalView && selectedZonal
        ? circuits.filter(circuit => circuit.zonal?.id.toString() === selectedZonal)
        : circuits;

    const isEditing = !!editingRoute;

        // Llenar formulario cuando se esté editando
    useEffect(() => {
        if (editingRoute) {
            setFormData({
                name: editingRoute.name,
                code: editingRoute.code,
                circuit_id: editingRoute.circuit_id.toString()
            });

            // En vista global, encontrar el zonal del circuito de la ruta
            if (isGlobalView && circuits && circuits.length > 0) {
                const routeCircuit = circuits.find(c => c.id === editingRoute.circuit_id);
                if (routeCircuit?.zonal) {
                    setSelectedZonal(routeCircuit.zonal.id.toString());
                }
            }
        } else {
            setFormData({
                name: '',
                code: '',
                circuit_id: circuit?.id?.toString() || ''
            });
            setSelectedZonal('');
        }
    }, [editingRoute?.id, circuit?.id, isOpen]);

    // Efecto separado para la vista global
    useEffect(() => {
        if (isGlobalView && editingRoute && circuits && circuits.length > 0) {
            const routeCircuit = circuits.find(c => c.id === editingRoute.circuit_id);
            if (routeCircuit?.zonal) {
                setSelectedZonal(routeCircuit.zonal.id.toString());
            }
        }
    }, [isGlobalView, editingRoute?.id, circuits]);

    // Limpiar errores cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setErrors({});
        }
    }, [isOpen]);

    // Manejar cambio de zonal (solo en vista global)
    const handleZonalChange = (zonalId: string) => {
        setSelectedZonal(zonalId);
        // Limpiar selección de circuito cuando cambie el zonal
        setFormData(prev => ({ ...prev, circuit_id: '' }));
    };

    // Manejar cambio de circuito
    const handleCircuitChange = (circuitId: string) => {
        setFormData(prev => ({ ...prev, circuit_id: circuitId }));
    };

    const generateCode = () => {
        const prefix = 'RTA';
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        const generatedCode = `${prefix}${timestamp}${random}`;

        setFormData(prev => ({ ...prev, code: generatedCode }));

        addToast({
            type: 'info',
            title: 'Código generado',
            message: `Se generó el código: ${generatedCode}`,
            duration: 3000
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Validaciones básicas
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre de la ruta es obligatorio';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'El código de la ruta es obligatorio';
        }

        if (isGlobalView) {
            if (!selectedZonal) {
                newErrors.zonal_id = 'El zonal es obligatorio';
            }
            if (!formData.circuit_id) {
                newErrors.circuit_id = 'El circuito es obligatorio';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        const submitData = {
            name: formData.name.trim(),
            code: formData.code.trim(),
            circuit_id: formData.circuit_id ? parseInt(formData.circuit_id) : null
        };

        // Validación adicional
        if (!submitData.circuit_id) {
            setErrors({ circuit_id: 'Debes seleccionar un circuito' });
            setIsSubmitting(false);
            return;
        }



                if (isEditing) {
            // Actualizar ruta existente
            const routeName = isGlobalView ? 'dcs.routes.update' : 'dcs.zonales.circuits.routes.update';
            const routeParams = isGlobalView
                ? { route: editingRoute.id }
                : [circuit?.zonal?.id, circuit?.id, editingRoute.id];

            router.patch(route(routeName, routeParams), submitData, {
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: '¡Ruta actualizada!',
                        message: `La ruta "${submitData.name}" se actualizó correctamente.`,
                        duration: 4000
                    });
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    addToast({
                        type: 'error',
                        title: 'Error al actualizar',
                        message: 'Por favor, revisa los errores en el formulario.',
                        duration: 4000
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } else {
            // Crear nueva ruta
            const routeName = isGlobalView ? 'dcs.routes.store' : 'dcs.zonales.circuits.routes.store';
            const routeParams = isGlobalView ? {} : [circuit?.zonal?.id, circuit?.id];

            router.post(route(routeName, routeParams), submitData, {
                onSuccess: () => {
                    addToast({
                        type: 'success',
                        title: '¡Ruta creada!',
                        message: `La ruta "${submitData.name}" se creó correctamente.`,
                        duration: 4000
                    });
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    addToast({
                        type: 'error',
                        title: 'Error al crear ruta',
                        message: 'Por favor, revisa los errores en el formulario.',
                        duration: 4000
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Route className="w-4 h-4 text-emerald-600" />
                        </div>
                        {isEditing ? 'Editar Ruta' : 'Nueva Ruta'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos de la ruta seleccionada.'
                            : 'Completa la información para crear una nueva ruta.'
                        }
                                        </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre de la ruta */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nombre de la Ruta
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ej: Ruta Principal Centro"
                            className={errors.name ? 'border-red-500' : ''}
                            maxLength={25}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name}</p>
                        )}

                        <p className="text-xs text-gray-500">
                            {formData.name.length}/25 caracteres
                        </p>
                    </div>

                    {/* Código de la ruta */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Código de la Ruta
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="code"
                                type="text"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                placeholder="Ej: RTA001"
                                className={errors.code ? 'border-red-500' : ''}
                                maxLength={25}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={generateCode}
                                className="flex-shrink-0 cursor-pointer"
                                title="Generar código automático"
                            >
                                <Shuffle className="w-4 h-4" />
                            </Button>
                        </div>
                        {errors.code && (
                            <p className="text-sm text-red-600">{errors.code}</p>
                        )}

                        <p className="text-xs text-gray-500">
                            {formData.code.length}/25 caracteres
                        </p>
                    </div>

                    {/* Selección de zonal y circuito (solo en vista global) */}
                    {isGlobalView && (
                        <>
                            {/* Selector de Zonal */}
                            <div className="space-y-2">
                                <Label htmlFor="zonal_id">
                                    Zonal
                                    <span className="text-red-500 ml-1">*</span>
                                </Label>
                                <Select
                                    value={selectedZonal || ""}
                                    onValueChange={handleZonalChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar zonal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {zonales.map((zonal) => (
                                            <SelectItem key={zonal.id} value={zonal.id.toString()}>
                                                {zonal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.zonal_id && (
                                    <p className="text-sm text-red-600">{errors.zonal_id}</p>
                                )}
                            </div>

                            {/* Selector de Circuito */}
                            <div className="space-y-2">
                                <Label htmlFor="circuit_id">
                                    Circuito
                                    <span className="text-red-500 ml-1">*</span>
                                </Label>
                                                                <Select
                                    value={formData.circuit_id || ""}
                                    onValueChange={handleCircuitChange}
                                    disabled={!selectedZonal}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={selectedZonal ? 'Seleccionar circuito' : 'Selecciona un zonal primero'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCircuits.map((circuit) => (
                                            <SelectItem key={circuit.id} value={circuit.id.toString()}>
                                                {circuit.name}{circuit.code ? ` - ${circuit.code}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.circuit_id && (
                                    <p className="text-sm text-red-600">{errors.circuit_id}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Información del circuito (vista jerárquica) */}
                    {!isGlobalView && circuit && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Circuito:</span> {circuit.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Código:</span> {circuit.code}
                            </p>
                            {circuit.zonal && (
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Zonal:</span> {circuit.zonal.name}
                                </p>
                            )}
                        </div>
                    )}
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    >
                        {isSubmitting ? (
                            'Procesando...'
                        ) : (
                            isEditing ? 'Actualizar Ruta' : 'Crear Ruta'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
