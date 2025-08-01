import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Circuit {
    id: number;
    name: string;
    code: string;
    frequency_days?: string[];
}

interface FrequencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    circuit: Circuit | null;
}

// Días de la semana en inglés y español
const WEEK_DAYS = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
];

export function FrequencyModal({ isOpen, onClose, circuit }: FrequencyModalProps) {
    const { addToast } = useToast();
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Inicializar días seleccionados cuando se abre el modal
    useEffect(() => {
        if (circuit && isOpen) {
            setSelectedDays(circuit.frequency_days || []);
        }
    }, [circuit, isOpen]);

    const handleDayToggle = (dayValue: string) => {
        setSelectedDays(prev => {
            if (prev.includes(dayValue)) {
                return prev.filter(day => day !== dayValue);
            } else {
                return [...prev, dayValue];
            }
        });
    };

    const handleSave = () => {
        if (!circuit) return;

        setIsLoading(true);

        router.post(route('dcs.circuits.frequencies.update', circuit.id), {
            frequencies: selectedDays
        }, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: 'Frecuencia actualizada',
                    message: 'Las frecuencias de visita se actualizaron exitosamente.',
                    duration: 4000
                });
                onClose();
            },
            onError: (errors) => {
                console.error('Error updating frequencies:', errors);
                addToast({
                    type: 'error',
                    title: 'Error al actualizar',
                    message: 'Hubo un problema al actualizar las frecuencias de visita.',
                    duration: 4000
                });
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleCancel = () => {
        if (!isLoading) {
            // Reset to original values
            setSelectedDays(circuit?.frequency_days || []);
            onClose();
        }
    };

    // Handler para tecla ESC
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && !isLoading) {
                handleCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, isLoading]);

    if (!circuit) return null;

    const selectedDaysCount = selectedDays.length;

    return (
        <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
            <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Frecuencia de Visitas
                    </DialogTitle>
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{circuit.name}</span>
                        <span className="text-gray-400 ml-2">({circuit.code})</span>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-4">
                        <div className="text-sm text-gray-700">
                            Selecciona los días de la semana en que se realizan las visitas a este circuito:
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {WEEK_DAYS.map((day) => (
                                <div key={day.value} className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Checkbox
                                        id={day.value}
                                        checked={selectedDays.includes(day.value)}
                                        onCheckedChange={() => handleDayToggle(day.value)}
                                        disabled={isLoading}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Label
                                        htmlFor={day.value}
                                        className={`text-sm cursor-pointer select-none transition-colors ${
                                            selectedDays.includes(day.value)
                                                ? 'text-blue-700 font-medium'
                                                : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                    >
                                        {day.label}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        {selectedDaysCount > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm text-blue-800">
                                    <span className="font-medium">
                                        {selectedDaysCount} día{selectedDaysCount > 1 ? 's' : ''} seleccionado{selectedDaysCount > 1 ? 's' : ''}:
                                    </span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {selectedDays.map(dayValue => {
                                            const day = WEEK_DAYS.find(d => d.value === dayValue);
                                            return (
                                                <span key={dayValue} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                    {day?.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Frecuencia
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}







