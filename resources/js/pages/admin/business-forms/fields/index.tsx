import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, FileText, Building, Eye } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { SectionModal } from '@/components/admin/business-forms/section-modal';
import { FieldModal } from '@/components/admin/business-forms/field-modal';
import { SectionsList } from '@/components/admin/business-forms/sections-list';
import { FormPreviewModal } from '@/components/admin/business-forms/form-preview-modal';
import { ConfirmDeleteSectionModal } from '@/components/admin/business-forms/confirm-delete-section-modal';
import { ConfirmDeleteFieldModal } from '@/components/admin/business-forms/confirm-delete-field-modal';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface FormField {
    id: number;
    name: string;
    type: string;
    is_required: boolean;
    options?: any;
    order_index: number;
    created_at: string;
    updated_at: string;
}

interface FormSection {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    order_index: number;
    fields: FormField[];
    created_at: string;
    updated_at: string;
}

interface BusinessForm {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    business_id: number;
    business: Business;
    sections: FormSection[];
    created_at: string;
    updated_at: string;
}

interface Props {
    form: BusinessForm;
    businessScope: any;
    flash?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Admin',
        href: '#',
    },
    {
        title: 'Formularios Dinámicos',
        href: '/admin/business-forms',
    },
    {
        title: 'Campos',
        href: '#',
    },
];

export default function BusinessFormFieldsIndex({ form, businessScope, flash }: Props) {
    const { addToast } = useToast();
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<FormSection | null>(null);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
    const [isDeleteFieldModalOpen, setIsDeleteFieldModalOpen] = useState(false);
    const [deletingSection, setDeletingSection] = useState<FormSection | null>(null);
    const [deletingField, setDeletingField] = useState<FormField | null>(null);

    // Validar que form existe
    if (!form) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Formulario no encontrado" />
                <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Formulario no encontrado
                            </h3>
                            <p className="text-gray-600 mb-6">
                                El formulario que buscas no existe o no tienes permisos para acceder a él.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => router.visit(route('admin.business-forms.index'))}
                                className="cursor-pointer transition-all duration-200 hover:scale-105"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver a Formularios
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const goBackToForms = () => {
        router.visit(route('admin.business-forms.index', { business_id: form.business_id }));
    };

    const openCreateSectionModal = () => {
        setEditingSection(null);
        setIsSectionModalOpen(true);
    };

    const closeSectionModal = () => {
        setIsSectionModalOpen(false);
        setEditingSection(null);
    };

    const openCreateFieldModal = (sectionId: number) => {
        setSelectedSectionId(sectionId);
        setEditingField(null);
        setIsFieldModalOpen(true);
    };

    const openEditFieldModal = (field: FormField) => {
        setSelectedSectionId(field.form_section_id);
        setEditingField(field);
        setIsFieldModalOpen(true);
    };

    const closeFieldModal = () => {
        setIsFieldModalOpen(false);
        setEditingField(null);
        setSelectedSectionId(null);
    };

    const openEditSectionModal = (section: FormSection) => {
        setEditingSection(section);
        setIsSectionModalOpen(true);
    };

    const openDeleteSectionModal = (section: FormSection) => {
        setDeletingSection(section);
        setIsDeleteSectionModalOpen(true);
    };

    const closeDeleteSectionModal = () => {
        setIsDeleteSectionModalOpen(false);
        setDeletingSection(null);
    };

    const openDeleteFieldModal = (field: FormField) => {
        setDeletingField(field);
        setIsDeleteFieldModalOpen(true);
    };

    const closeDeleteFieldModal = () => {
        setIsDeleteFieldModalOpen(false);
        setDeletingField(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Campos - ${form.name}`} />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goBackToForms}
                                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:scale-105 w-fit"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span className="hidden sm:inline">Volver a Formularios</span>
                                            <span className="sm:hidden">Volver</span>
                                        </Button>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                                                Campos - {form.name}
                                            </h1>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                Gestiona los campos del formulario dinámico
                                            </p>
                                        </div>
                                    </div>

                                    {/* Información del formulario */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <span>{form.sections.length} secciones</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <Building className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="truncate">{form.business.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${form.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span>{form.is_active ? 'Activo' : 'Inactivo'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        onClick={() => setIsPreviewModalOpen(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button
                                        onClick={openCreateSectionModal}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Nueva Sección
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <SectionsList
                            sections={form.sections}
                            onEditSection={openEditSectionModal}
                            onDeleteSection={openDeleteSectionModal}
                            onAddField={openCreateFieldModal}
                            onEditField={openEditFieldModal}
                            onDeleteField={openDeleteFieldModal}
                        />
                    </div>
                </div>

                {/* Botones flotantes - Solo móviles */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden flex flex-col gap-3">
                    <Button
                        onClick={() => setIsPreviewModalOpen(true)}
                        size="lg"
                        className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Preview del formulario"
                    >
                        <Eye className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={openCreateSectionModal}
                        size="lg"
                        className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        title="Nueva sección"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>

                {/* Modal de sección */}
                <SectionModal
                    isOpen={isSectionModalOpen}
                    onClose={closeSectionModal}
                    section={editingSection}
                    formId={form.id}
                />

                {/* Modal de campo */}
                {selectedSectionId && (
                    <FieldModal
                        isOpen={isFieldModalOpen}
                        onClose={closeFieldModal}
                        field={editingField}
                        formId={form.id}
                        sectionId={selectedSectionId}
                    />
                )}

                {/* Modal de preview */}
                <FormPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    form={form}
                />

                {/* Modal de confirmación para eliminar sección */}
                <ConfirmDeleteSectionModal
                    open={isDeleteSectionModalOpen}
                    onClose={closeDeleteSectionModal}
                    section={deletingSection}
                    formId={form.id}
                />

                {/* Modal de confirmación para eliminar campo */}
                <ConfirmDeleteFieldModal
                    open={isDeleteFieldModalOpen}
                    onClose={closeDeleteFieldModal}
                    field={deletingField}
                    formId={form.id}
                />
            </div>
        </AppLayout>
    );
}
