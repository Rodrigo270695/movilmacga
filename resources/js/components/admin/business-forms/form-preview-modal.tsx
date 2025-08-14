import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Eye, FileText, Building, Save, X } from 'lucide-react';

interface FormField {
    id: number;
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

interface FormSection {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    order_index: number;
    fields: FormField[];
}

interface BusinessForm {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    business: {
        id: number;
        name: string;
    };
    sections: FormSection[];
}

interface FormPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: BusinessForm;
}

export function FormPreviewModal({ isOpen, onClose, form }: FormPreviewModalProps) {
    const [formData, setFormData] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (fieldId: number, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simular envío
        setTimeout(() => {
            console.log('Form data:', formData);
            setIsSubmitting(false);
            alert('¡Formulario enviado exitosamente! (Simulación)');
            onClose();
        }, 1000);
    };

    const renderField = (field: FormField) => {
        if (!field.is_active) return null;

        const commonProps = {
            id: `field-${field.id}`,
            placeholder: field.placeholder,
            required: field.is_required,
            value: formData[field.id] || '',
            onChange: (e: any) => handleInputChange(field.id, e.target.value),
            className: "w-full"
        };

        switch (field.field_type) {
            case 'text':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="text"
                            {...commonProps}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="number"
                            min={field.min_value}
                            max={field.max_value}
                            {...commonProps}
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Textarea
                            rows={4}
                            {...commonProps}
                        />
                    </div>
                );

            case 'select':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Select
                            value={formData[field.id] || ''}
                            onValueChange={(value) => handleInputChange(field.id, value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option, index) => (
                                    <SelectItem key={index} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`field-${field.id}`}
                            checked={formData[field.id] || false}
                            onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                        />
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                    </div>
                );

            case 'image':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="file"
                            accept={field.file_types || "image/*"}
                            onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                            Tipos permitidos: {field.file_types || 'jpg, png, gif'} |
                            Máximo: {field.max_file_size || 2048} KB
                        </p>
                    </div>
                );

            case 'pdf':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                            Solo archivos PDF | Máximo: {field.max_file_size || 2048} KB
                        </p>
                    </div>
                );

            case 'location':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Latitud"
                                value={formData[field.id]?.lat || ''}
                                onChange={(e) => handleInputChange(field.id, {
                                    ...formData[field.id],
                                    lat: e.target.value
                                })}
                                className="flex-1"
                            />
                            <Input
                                type="text"
                                placeholder="Longitud"
                                value={formData[field.id]?.lng || ''}
                                onChange={(e) => handleInputChange(field.id, {
                                    ...formData[field.id],
                                    lng: e.target.value
                                })}
                                className="flex-1"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                                // Simular captura de GPS
                                const lat = (Math.random() * 180 - 90).toFixed(6);
                                const lng = (Math.random() * 360 - 180).toFixed(6);
                                handleInputChange(field.id, { lat, lng });
                            }}
                        >
                            📍 Capturar ubicación
                        </Button>
                    </div>
                );

            case 'signature':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="text-gray-500 mb-2">✍️</div>
                            <p className="text-sm text-gray-600">Área para firma digital</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={() => handleInputChange(field.id, 'firma_simulada')}
                            >
                                Firmar aquí
                            </Button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-sm font-medium text-gray-700">
                            {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="text"
                            {...commonProps}
                        />
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <Eye className="w-4 h-4 text-purple-600" />
                        </div>
                        Preview del Formulario
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Vista previa de cómo se verá el formulario para los usuarios
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información del formulario */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-gray-900">{form.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-gray-600">{form.business.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-sm text-gray-600">Formulario activo</span>
                            </div>
                        </div>
                        {form.description && (
                            <p className="text-sm text-gray-600 mt-2">{form.description}</p>
                        )}
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {form.sections
                            .filter(section => section.is_active)
                            .map((section) => (
                                <div key={section.id} className="border border-gray-200 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {section.name}
                                        </h3>
                                        {section.description && (
                                            <p className="text-sm text-gray-600">{section.description}</p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {section.fields
                                            .filter(field => field.is_active)
                                            .sort((a, b) => a.order_index - b.order_index)
                                            .map(renderField)}
                                    </div>
                                </div>
                            ))}

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto cursor-pointer transition-all duration-200 hover:scale-105"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cerrar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-all duration-200 hover:scale-105"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Enviando...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        <span>Enviar Formulario (Simulación)</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
