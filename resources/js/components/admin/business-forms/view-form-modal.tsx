import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    FileText,
    Building,
    Calendar,
    Settings,
    Info,
    Edit3
} from 'lucide-react';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface BusinessForm {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    business_id: number;
    business: Business;
    sections_count: number;
    active_sections_count: number;
    fields_count: number;
    active_fields_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    form: BusinessForm | null;
    onEdit?: (form: BusinessForm) => void;
}

export function ViewFormModal({ open, onClose, form, onEdit }: Props) {
    if (!form) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-gray-900">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        Detalles del Formulario
                    </DialogTitle>
                    <DialogDescription>
                        Información completa del formulario dinámico
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información principal */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                                {form.description && (
                                    <p className="text-sm text-gray-600">{form.description}</p>
                                )}
                            </div>
                            <Badge className={`${
                                form.is_active
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                            } text-xs font-medium border`}>
                                {form.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{form.business.name}</span>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{form.sections_count}</div>
                            <div className="text-xs text-blue-700 font-medium">Secciones</div>
                            <div className="text-xs text-blue-600 mt-1">
                                {form.active_sections_count} activas
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{form.fields_count}</div>
                            <div className="text-xs text-green-700 font-medium">Campos</div>
                            <div className="text-xs text-green-600 mt-1">
                                {form.active_fields_count} activos
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {form.sections_count > 0 ? Math.round((form.active_sections_count / form.sections_count) * 100) : 0}%
                            </div>
                            <div className="text-xs text-purple-700 font-medium">Secciones Activas</div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {form.fields_count > 0 ? Math.round((form.active_fields_count / form.fields_count) * 100) : 0}%
                            </div>
                            <div className="text-xs text-orange-700 font-medium">Campos Activos</div>
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Creado</span>
                            </div>
                            <p className="text-sm text-gray-600">{formatDate(form.created_at)}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Última actualización</span>
                            </div>
                            <p className="text-sm text-gray-600">{formatDate(form.updated_at)}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                        Cerrar
                    </Button>
                    {onEdit && (
                        <Button
                            onClick={() => onEdit(form)}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Editar Formulario
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
