import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Calendar,
    Plus,
    X
} from 'lucide-react';

interface RouteModel {
    id: number;
    name: string;
    code: string;
    circuit?: {
        id: number;
        name: string;
        zonal?: {
            id: number;
            name: string;
        };
    };
}

interface VisitDate {
    id: number;
    visit_date: string;
    is_active: boolean;
    notes?: string;
    formatted_date?: string;
    day_of_week_spanish?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    route: RouteModel | null;
}

export function VisitDatesModal({ isOpen, onClose, route }: Props) {
    const { addToast } = useToast();

    // Función para obtener la fecha actual en zona horaria de Perú
    const getPeruDate = () => {
        return new Date().toLocaleString("en-US", {timeZone: "America/Lima"});
    };

    // Función para obtener fecha en formato YYYY-MM-DD en zona horaria de Perú
    const getPeruDateString = () => {
        const peruDate = new Date().toLocaleString("en-US", {timeZone: "America/Lima"});
        const date = new Date(peruDate);
        return date.toISOString().split('T')[0];
    };

    // Función para crear fecha en zona horaria de Perú
    const createPeruDate = (year: number, month: number, day: number) => {
        const date = new Date(year, month - 1, day);
        // Ajustar a zona horaria de Perú
        const peruDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Lima"}));
        return peruDate;
    };

    const [selectedYear, setSelectedYear] = useState(new Date(getPeruDate()).getFullYear());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [visitDates, setVisitDates] = useState<VisitDate[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Generar años disponibles (desde 2020 hasta 2030)
    const availableYears = Array.from({ length: 11 }, (_, i) => 2020 + i);

    // Generar calendario para el año seleccionado
    const generateCalendar = (year: number) => {
        const calendar = [];
        const peruNow = new Date(getPeruDate());
        const peruToday = getPeruDateString();

        for (let month = 1; month <= 12; month++) {
            const monthData = {
                month,
                monthName: new Date(year, month - 1, 1).toLocaleDateString('es-ES', {
                    month: 'long',
                    timeZone: 'America/Lima'
                }),
                weeks: []
            };

            const firstDay = createPeruDate(year, month, 1);
            const daysInMonth = new Date(year, month, 0).getDate();
            const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

            let week = [];

            // Agregar días vacíos al inicio si es necesario
            for (let i = 0; i < firstDayOfWeek; i++) {
                week.push(null);
            }

            // Agregar todos los días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                const date = createPeruDate(year, month, day);
                const dateString = date.toISOString().split('T')[0];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = dateString === peruToday;
                // Permitir selección desde hoy (incluyendo hoy)
                const isPast = dateString < peruToday;
                const hasVisit = visitDates.some(vd => {
                    const visitDate = new Date(vd.visit_date);
                    return visitDate.toISOString().split('T')[0] === dateString;
                });
                const isSelected = selectedDates.includes(dateString);

                week.push({
                    day,
                    date: dateString,
                    isWeekend,
                    isToday,
                    isPast,
                    hasVisit,
                    isSelected
                });

                // Si la semana está completa (7 días), agregarla al mes
                if (week.length === 7) {
                    monthData.weeks.push(week);
                    week = [];
                }
            }

            // Agregar la última semana si tiene días
            if (week.length > 0) {
                // Completar con días vacíos si es necesario
                while (week.length < 7) {
                    week.push(null);
                }
                monthData.weeks.push(week);
            }

            calendar.push(monthData);
        }

        return calendar;
    };

    // Cargar fechas de visita cuando cambie el año o la ruta
    useEffect(() => {
        if (isOpen && route) {
            loadVisitDates();
        }
    }, [isOpen, route, selectedYear]);

    // Limpiar datos cuando se cierre el modal
    useEffect(() => {
        if (!isOpen) {
            setSelectedDates([]);
            setVisitDates([]);
            setSelectedYear(new Date(getPeruDate()).getFullYear());
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Función para obtener la fecha actual formateada en español
    const getCurrentDateFormatted = () => {
        const peruDate = new Date(getPeruDate());
        return peruDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Lima'
        });
    };

    // Función para limpiar completamente el modal
    const clearModalData = () => {
        setSelectedDates([]);
        setVisitDates([]);
        setSelectedYear(new Date(getPeruDate()).getFullYear());
        setIsSubmitting(false);
    };

    // Marcar fechas existentes como seleccionadas cuando se carguen inicialmente
    useEffect(() => {
        if (visitDates.length > 0 && selectedDates.length === 0) {
            const existingDates = visitDates.map(vd => {
                // Convertir fecha ISO a formato YYYY-MM-DD
                const date = new Date(vd.visit_date);
                return date.toISOString().split('T')[0];
            });
            setSelectedDates(existingDates);
        }
    }, [visitDates, selectedDates.length]);

    const loadVisitDates = async () => {
        if (!route) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                start_date: `${selectedYear}-01-01`,
                end_date: `${selectedYear}-12-31`
            });

            const response = await fetch(`/dcs/routes/${route.id}/visit-dates/range?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.ok) {
                const data = await response.json();
                setVisitDates(data);
            }
        } catch (error) {
            console.error('Error loading visit dates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateClick = (date: string) => {
        if (!date) return;

        // Permitir selección desde hoy (incluyendo hoy)
        const peruToday = getPeruDateString();
        if (date < peruToday) {
            addToast({
                type: 'error',
                title: 'Fecha no válida',
                message: 'No puedes seleccionar fechas pasadas.',
                duration: 3000
            });
            return;
        }

        setSelectedDates(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            } else {
                return [...prev, date];
            }
        });
    };

    const handleSaveDates = async () => {
        if (!route || selectedDates.length === 0) return;

        setIsSubmitting(true);
        try {
            if (visitDates.length > 0) {
                // Actualizar: eliminar todas las fechas existentes y agregar las nuevas
                router.delete(`/dcs/routes/${route.id}/visit-dates`, {
                    onSuccess: () => {
                        // Después de eliminar, agregar las nuevas fechas
                        router.post(`/dcs/routes/${route.id}/visit-dates`, {
                            dates: selectedDates
                        }, {
                            onSuccess: () => {
                                addToast({
                                    type: 'success',
                                    title: 'Fechas actualizadas',
                                    message: `${selectedDates.length} fecha(s) de visita actualizada(s) exitosamente.`,
                                    duration: 4000
                                });
                                // Limpiar datos antes de cerrar
                                clearModalData();
                                // Cerrar el modal después de actualizar exitosamente
                                onClose();
                            },
                            onError: () => {
                                addToast({
                                    type: 'error',
                                    title: 'Error',
                                    message: 'No se pudieron actualizar las fechas de visita.',
                                    duration: 4000
                                });
                            }
                        });
                    },
                    onError: () => {
                        addToast({
                            type: 'error',
                            title: 'Error',
                            message: 'No se pudieron eliminar las fechas existentes.',
                            duration: 4000
                        });
                    }
                });
            } else {
                // Crear nuevas fechas
                router.post(`/dcs/routes/${route.id}/visit-dates`, {
                    dates: selectedDates
                }, {
                    onSuccess: () => {
                        addToast({
                            type: 'success',
                            title: 'Fechas guardadas',
                            message: `${selectedDates.length} fecha(s) de visita guardada(s) exitosamente.`,
                            duration: 4000
                        });
                        // Limpiar datos antes de cerrar
                        clearModalData();
                        // Cerrar el modal después de guardar exitosamente
                        onClose();
                    },
                    onError: () => {
                        addToast({
                            type: 'error',
                            title: 'Error',
                            message: 'No se pudieron guardar las fechas de visita.',
                            duration: 4000
                        });
                    }
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };



    const calendar = useMemo(() => generateCalendar(selectedYear), [selectedYear, selectedDates, visitDates]);

                    // Ancho fijo del modal - más estrecho para forzar el comportamiento
    const modalClasses = 'max-w-4xl w-[80vw] max-h-[95vh] overflow-y-auto overflow-x-hidden';



    if (!route) return null;

    const handleClose = () => {
        clearModalData();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className={modalClasses}
                style={{ width: '80vw', maxWidth: '896px' }}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-600">
                        <Calendar className="w-5 h-5" />
                        Fechas de Visita - {route.name}
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona las fechas de visita para la ruta {route.code}
                        {route.circuit && (
                            <span className="text-gray-500">
                                {' '}• Circuito: {route.circuit.name}
                                {route.circuit.zonal && (
                                    <span> • Zonal: {route.circuit.zonal.name}</span>
                                )}
                            </span>
                        )}
                        <br />
                        <span className="text-xs text-gray-400 mt-1 block">
                            Zona horaria: Perú (America/Lima) • Puedes seleccionar fechas desde hoy
                        </span>
                        <br />
                        <span className="text-xs text-blue-600 mt-1 block font-medium">
                            Fecha actual: {getCurrentDateFormatted()}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Controles */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedDates.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {selectedDates.length} fecha(s) seleccionada(s)
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedDates([])}
                                        className="h-8 px-2"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedDates.length > 0 && (
                                <Button
                                    onClick={handleSaveDates}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {visitDates.length > 0 ? 'Actualizando...' : 'Guardando...'}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            {visitDates.length > 0 ? 'Actualizar Fechas' : 'Guardar Fechas'}
                                        </div>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>



                    {/* Calendario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {calendar.map((month) => (
                            <div key={month.month} className="bg-white border rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3 text-center capitalize">
                                    {month.monthName}
                                </h3>

                                {/* Días de la semana */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                                        <div key={index} className="text-xs text-gray-500 text-center font-medium">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Días del mes */}
                                <div className="grid grid-cols-7 gap-1">
                                    {month.weeks.flat().map((day, index) => {
                                        if (!day) {
                                            return <div key={index} className="h-8" />;
                                        }

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleDateClick(day.date)}
                                                disabled={day.isPast && !day.isToday}
                                                className={`
                                                    h-8 w-8 text-xs rounded flex items-center justify-center
                                                    transition-all duration-200 cursor-pointer
                                                    ${day.isPast && !day.isToday
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : day.isWeekend
                                                            ? 'text-red-600 hover:bg-red-50'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                    }
                                                    ${day.isToday
                                                        ? 'bg-blue-100 text-blue-700 font-bold border-2 border-blue-300'
                                                        : ''
                                                    }
                                                    ${day.hasVisit
                                                        ? 'bg-green-100 text-green-700 font-medium'
                                                        : ''
                                                    }
                                                    ${day.isSelected
                                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                        : ''
                                                    }
                                                `}
                                            >
                                                {day.day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leyenda */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-100 rounded border border-blue-300"></div>
                            <span>Hoy (seleccionable)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-100 rounded"></div>
                            <span>Con visita</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-indigo-100 rounded"></div>
                            <span>Seleccionado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-50 rounded"></div>
                            <span>Fin de semana</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-100 rounded"></div>
                            <span>Fechas futuras</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
