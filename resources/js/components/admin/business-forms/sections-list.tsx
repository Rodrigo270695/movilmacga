import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Eye, EyeOff, Layers, FileText } from 'lucide-react';
import { useState } from 'react';

interface FormField {
    id: number;
    field_type: string;
    label: string;
    placeholder?: string;
    is_required: boolean;
    is_active: boolean;
    order_index: number;
}

interface FormSection {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    order_index: number;
    fields: FormField[];
}

interface SectionsListProps {
    sections: FormSection[];
    onEditSection: (section: FormSection) => void;
    onDeleteSection: (section: FormSection) => void;
    onAddField: (sectionId: number) => void;
    onEditField: (field: FormField) => void;
    onDeleteField: (field: FormField) => void;
}

export function SectionsList({
    sections,
    onEditSection,
    onDeleteSection,
    onAddField,
    onEditField,
    onDeleteField
}: SectionsListProps) {
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

    const toggleSection = (sectionId: number) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

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

    if (sections.length === 0) {
        return (
            <div className="text-center py-12">
                <Layers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay secciones creadas
                </h3>
                <p className="text-gray-600 mb-6">
                    Crea tu primera sección para comenzar a organizar los campos del formulario.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sections.map((section) => (
                <Card key={section.id} className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSection(section.id)}
                                    className="p-1 h-auto cursor-pointer flex-shrink-0"
                                >
                                    {expandedSections.has(section.id) ? (
                                        <Eye className="w-4 h-4 text-gray-600" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-gray-600" />
                                    )}
                                </Button>

                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="truncate">{section.name}</span>
                                        <Badge
                                            variant={section.is_active ? "default" : "secondary"}
                                            className={`flex-shrink-0 ${
                                                section.is_active
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {section.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </CardTitle>
                                    {section.description && (
                                        <p className="text-sm text-gray-600 mt-1 truncate">
                                            {section.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
                                >
                                    {section.fields.length} campos
                                </Badge>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleSection(section.id)}
                                    className="h-8 px-2 sm:px-3 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
                                    title={expandedSections.has(section.id) ? "Ocultar campos" : "Ver campos"}
                                >
                                    <span className="hidden sm:inline">
                                        {expandedSections.has(section.id) ? "Ocultar" : "Ver campos"}
                                    </span>
                                    <span className="sm:hidden">
                                        {expandedSections.has(section.id) ? "Ocultar" : "Ver"}
                                    </span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAddField(section.id)}
                                        className="h-8 w-8 p-0 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Agregar campo"
                                    >
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEditSection(section)}
                                        className="h-8 w-8 p-0 hover:bg-sky-50 hover:border-sky-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Editar sección"
                                    >
                                        <Edit className="w-4 h-4 text-sky-600" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDeleteSection(section)}
                                        className="h-8 w-8 p-0 hover:bg-rose-50 hover:border-rose-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Eliminar sección"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {expandedSections.has(section.id) && (
                        <CardContent className="pt-0">
                            {section.fields.length === 0 ? (
                                <div className="text-center py-6 border-t border-gray-100">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600 mb-3">
                                        Esta sección no tiene campos
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAddField(section.id)}
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer transition-all duration-200 hover:scale-105"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar primer campo
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 border-t border-gray-100 pt-4">
                                    {section.fields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-lg flex-shrink-0">
                                                    {getFieldTypeIcon(field.field_type)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <span className="font-medium text-gray-900 truncate">
                                                            {field.label}
                                                        </span>
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            {field.is_required && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="text-xs bg-rose-100 text-rose-800 border-rose-200 flex-shrink-0"
                                                                >
                                                                    Requerido
                                                                </Badge>
                                                            )}
                                                            <Badge
                                                                variant={field.is_active ? "default" : "secondary"}
                                                                className={`text-xs flex-shrink-0 ${
                                                                    field.is_active
                                                                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                                }`}
                                                            >
                                                                {getFieldTypeLabel(field.field_type)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {field.placeholder && (
                                                        <p className="text-sm text-gray-600 mt-1 truncate">
                                                            {field.placeholder}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 justify-end sm:justify-start">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEditField(field)}
                                                    className="h-8 w-8 p-0 hover:bg-sky-50 cursor-pointer transition-all duration-200 hover:scale-105"
                                                    title="Editar campo"
                                                >
                                                    <Edit className="w-4 h-4 text-sky-600" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDeleteField(field)}
                                                    className="h-8 w-8 p-0 hover:bg-rose-50 cursor-pointer transition-all duration-200 hover:scale-105"
                                                    title="Eliminar campo"
                                                >
                                                    <Trash2 className="w-4 h-4 text-rose-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}
