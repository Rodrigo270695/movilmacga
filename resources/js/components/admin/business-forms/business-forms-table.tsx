import { Button } from '@/components/ui/button';
import { FileText, Eye, Edit, Power, Settings } from 'lucide-react';

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

interface PaginatedForms {
    data: BusinessForm[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface BusinessFormsTableProps {
    forms: PaginatedForms;
    filteredBusiness: Business | null;
    userPermissions: string[];
    onView: (form: BusinessForm) => void;
    onEdit: (form: BusinessForm) => void;
    onToggleStatus: (form: BusinessForm) => void;
    onManageFields: (form: BusinessForm) => void;
}

export function BusinessFormsTable({
    forms,
    filteredBusiness,
    userPermissions,
    onView,
    onEdit,
    onToggleStatus,
    onManageFields
}: BusinessFormsTableProps) {

    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Header de tabla */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                        Formularios ({forms.total})
                    </h3>
                </div>
            </div>

            {/* Vista de escritorio - Tabla */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                FORMULARIO
                            </th>
                            {!filteredBusiness && (
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    NEGOCIO
                                </th>
                            )}
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SECCIONES
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CAMPOS
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ESTADO
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CREADO
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ACCIONES
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {forms.data.map((form) => (
                            <tr key={form.id} className="hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center mr-3">
                                            <FileText className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {form.name}
                                            </div>
                                            {form.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {form.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                {!filteredBusiness && (
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {form.business.name}
                                    </td>
                                )}
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {form.active_sections_count}/{form.sections_count}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {form.active_fields_count}/{form.fields_count}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        form.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {form.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(form.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-1">
                                        {hasPermission('gestor-formularios-ver') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onView(form)}
                                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                                title="Ver formulario"
                                            >
                                                <Eye className="w-4 h-4 text-blue-600" />
                                            </Button>
                                        )}

                                        {hasPermission('gestor-formularios-editar') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(form)}
                                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                                title="Editar formulario"
                                            >
                                                <Edit className="w-4 h-4 text-green-600" />
                                            </Button>
                                        )}

                                        {hasPermission('gestor-formularios-cambiar-estado') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onToggleStatus(form)}
                                                className={`h-8 w-8 p-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                                    form.is_active
                                                        ? "hover:bg-red-50 hover:border-red-200"
                                                        : "hover:bg-green-50 hover:border-green-200"
                                                }`}
                                                title={form.is_active ? "Desactivar" : "Activar"}
                                            >
                                                <Power className={`w-4 h-4 ${
                                                    form.is_active ? "text-red-600" : "text-green-600"
                                                }`} />
                                            </Button>
                                        )}

                                        {hasPermission('gestor-formularios-editar') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onManageFields(form)}
                                                className="h-8 w-8 p-0 hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                                title="Gestionar campos"
                                            >
                                                <Settings className="w-4 h-4 text-purple-600" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Vista móvil - Tarjetas */}
            <div className="sm:hidden">
                <div className="divide-y divide-gray-200">
                    {forms.data.map((form) => (
                        <div key={form.id} className="p-4 hover:bg-gray-50">
                            {/* Header de la tarjeta */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {form.name}
                                        </h4>
                                        {form.description && (
                                            <p className="text-xs text-gray-500 truncate mt-1">
                                                {form.description}
                                            </p>
                                        )}
                                        {!filteredBusiness && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {form.business.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Estado */}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                                    form.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {form.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            {/* Información del formulario */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">Secciones:</span>
                                    <span>{form.active_sections_count}/{form.sections_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">Campos:</span>
                                    <span>{form.active_fields_count}/{form.fields_count}</span>
                                </div>
                            </div>

                            {/* Fecha de creación */}
                            <div className="text-xs text-gray-500 mb-3">
                                Creado: {new Date(form.created_at).toLocaleDateString('es-ES')}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2">
                                {hasPermission('gestor-formularios-ver') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onView(form)}
                                        className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Ver formulario"
                                    >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                    </Button>
                                )}

                                {hasPermission('gestor-formularios-editar') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(form)}
                                        className="h-9 w-9 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Editar formulario"
                                    >
                                        <Edit className="w-4 h-4 text-green-600" />
                                    </Button>
                                )}

                                {hasPermission('gestor-formularios-cambiar-estado') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onToggleStatus(form)}
                                        className={`h-9 w-9 p-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                            form.is_active
                                                ? "hover:bg-red-50 hover:border-red-200"
                                                : "hover:bg-green-50 hover:border-green-200"
                                        }`}
                                        title={form.is_active ? "Desactivar" : "Activar"}
                                    >
                                        <Power className={`w-4 h-4 ${
                                            form.is_active ? "text-red-600" : "text-green-600"
                                        }`} />
                                    </Button>
                                )}

                                {hasPermission('gestor-formularios-editar') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onManageFields(form)}
                                        className="h-9 w-9 p-0 hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                        title="Gestionar campos"
                                    >
                                        <Settings className="w-4 h-4 text-purple-600" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
