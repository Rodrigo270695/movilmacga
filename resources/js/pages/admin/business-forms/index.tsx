import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Plus, FileText, Eye, Edit, Trash2, Power, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { BusinessFormModal } from '@/components/admin/business-forms/business-form-modal';
import { ViewFormModal } from '@/components/admin/business-forms/view-form-modal';
import { BusinessFormsTable } from '@/components/admin/business-forms/business-forms-table';
import { BusinessFormsFilters } from '@/components/admin/business-forms/business-forms-filters';

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

interface Props {
    forms: PaginatedForms;
    businesses: Business[];
    businessScope: {
        is_admin: boolean;
        business_id?: number;
        business_ids: number[];
    };
    filters?: {
        search?: string;
        business_filter?: string;
        status_filter?: string;
        per_page?: number;
        business_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
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
];

export default function BusinessFormsIndex({ forms, businesses, businessScope, filters = {}, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedBusiness, setSelectedBusiness] = useState(filters.business_filter || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status_filter || '');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<BusinessForm | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingForm, setViewingForm] = useState<BusinessForm | null>(null);

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Mostrar toasts para mensajes flash
    useEffect(() => {
        if (flash?.success) {
            addToast({
                type: 'success',
                title: '¡Éxito!',
                message: flash.success,
                duration: 4000
            });
        }

        if (flash?.error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: flash.error,
                duration: 5000
            });
        }
    }, [flash, addToast]);

    // Detectar si estamos viendo formularios de un negocio específico
    const filteredBusiness = filters.business_id ?
        businesses.find(b => b.id.toString() === filters.business_id) : null;

    // Función para aplicar filtros
    const applyFilters = (overrides = {}) => {
        const params: Record<string, string> = {};

        if (searchTerm?.trim()) params.search = searchTerm;
        if (selectedBusiness?.trim()) params.business_filter = selectedBusiness;
        if (selectedStatus?.trim()) params.status_filter = selectedStatus;

        Object.assign(params, overrides);

        router.get(route('admin.business-forms.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Función para manejar búsqueda con debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setTimeout(() => {
            applyFilters();
        }, 500);
    };

    // Función para manejar cambio de negocio
    const handleBusinessChange = (business: string) => {
        setSelectedBusiness(business);
        setTimeout(() => {
            applyFilters();
        }, 100);
    };

    // Función para manejar cambio de estado
    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        setTimeout(() => {
            applyFilters();
        }, 100);
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedBusiness('');
        setSelectedStatus('');
        router.get(route('admin.business-forms.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Función para volver a negocios
    const goBackToBusinesses = () => {
        router.visit('/admin/businesses');
    };

    // Función para abrir modal de crear formulario
    const openCreateFormModal = () => {
        if (!hasPermission('gestor-formularios-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear formularios.',
                duration: 4000
            });
            return;
        }
        setEditingForm(null);
        setIsFormModalOpen(true);
    };

    // Función para abrir modal de editar formulario
    const openEditFormModal = (form: BusinessForm) => {
        if (!hasPermission('gestor-formularios-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para editar formularios.',
                duration: 4000
            });
            return;
        }
        setEditingForm(form);
        setIsFormModalOpen(true);
    };

    // Función para cerrar modal
    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingForm(null);
    };

    // Función para abrir modal de ver formulario
    const openViewModal = (form: BusinessForm) => {
        if (!hasPermission('gestor-formularios-ver')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para ver formularios.',
                duration: 4000
            });
            return;
        }
        setViewingForm(form);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewingForm(null);
    };

    const openEditFromView = (form: BusinessForm) => {
        closeViewModal();
        openEditFormModal(form);
    };

    const handleManageFields = (form: BusinessForm) => {
        if (!hasPermission('gestor-formularios-editar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para gestionar campos de formularios.',
                duration: 4000
            });
            return;
        }
        // Navegar a la vista de gestión de campos
        router.visit(route('admin.business-forms.fields.index', form.id));
    };

    // Función para cambiar estado del formulario
    const handleToggleStatus = (form: BusinessForm) => {
        if (!hasPermission('gestor-formularios-cambiar-estado')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para cambiar el estado de formularios.',
                duration: 4000
            });
            return;
        }

        router.patch(route('admin.business-forms.toggle-status', form.id), {}, {
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: 'Estado actualizado',
                    message: `Formulario ${form.is_active ? 'desactivado' : 'activado'} exitosamente.`,
                    duration: 3000
                });
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo cambiar el estado del formulario.',
                    duration: 4000
                });
            }
        });
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Formularios Dinámicos" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">

                    {/* Header - Responsive */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {filteredBusiness && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={goBackToBusinesses}
                                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 cursor-pointer transition-all duration-200 hover:scale-105 w-fit"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Volver a Negocios</span>
                                                <span className="sm:hidden">Volver</span>
                                            </Button>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                                                {filteredBusiness
                                                    ? `Formularios - ${filteredBusiness.name}`
                                                    : 'Formularios Dinámicos'
                                                }
                                            </h1>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                {filteredBusiness
                                                    ? 'Formularios personalizados de este negocio'
                                                    : 'Gestiona formularios personalizados para cada negocio'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats - Responsive */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                            <span>{forms.total} formularios</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                            <span>{businesses.length} negocios disponibles</span>
                                        </div>
                                        {forms.last_page > 1 && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                                                <span>Pág. {forms.current_page}/{forms.last_page}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botones desktop - Solo mostrar en pantallas grandes */}
                                {hasPermission('gestor-formularios-crear') && (
                                    <div className="hidden sm:block">
                                        <Button
                                            onClick={openCreateFormModal}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Formulario
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filtros - Solo mostrar si no hay negocio específico */}
                    {!filteredBusiness && (
                        <BusinessFormsFilters
                            searchTerm={searchTerm}
                            selectedBusiness={selectedBusiness}
                            selectedStatus={selectedStatus}
                            businesses={businesses}
                            onSearchChange={handleSearch}
                            onBusinessChange={handleBusinessChange}
                            onStatusChange={handleStatusChange}
                            onClearFilters={clearFilters}
                        />
                    )}

                    {/* Tabla de formularios */}
                    <BusinessFormsTable
                        forms={forms}
                        filteredBusiness={filteredBusiness || null}
                        userPermissions={userPermissions}
                        onView={openViewModal}
                        onEdit={openEditFormModal}
                        onToggleStatus={handleToggleStatus}
                        onManageFields={handleManageFields}
                    />

                    {/* Paginación */}
                    <Pagination
                        data={forms}
                        onPageChange={(page) => applyFilters({ page: page.toString() })}
                        onPerPageChange={(perPage) => applyFilters({ per_page: perPage.toString() })}
                    />
                </div>

                {/* Botón flotante - Solo móviles */}
                {hasPermission('gestor-formularios-crear') && (
                    <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                        <Button
                            onClick={openCreateFormModal}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </div>
                )}

                {/* Modales */}
                <BusinessFormModal
                    isOpen={isFormModalOpen}
                    onClose={closeFormModal}
                    form={editingForm}
                    businesses={businesses}
                    preselectedBusinessId={filteredBusiness?.id}
                />



                <ViewFormModal
                    open={isViewModalOpen}
                    onClose={closeViewModal}
                    form={viewingForm}
                    onEdit={openEditFromView}
                />
            </div>
        </AppLayout>
    );
}
