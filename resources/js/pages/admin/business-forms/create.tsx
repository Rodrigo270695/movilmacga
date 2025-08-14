import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, FileText, Building, Info } from 'lucide-react';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { useToast } from '@/components/ui/toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';

interface Business {
    id: number;
    name: string;
    status: boolean;
}

interface Props {
    businesses: Business[];
    businessScope: {
        is_admin: boolean;
        business_id?: number;
        business_ids: number[];
    };
    preselectedBusinessId?: number;
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
    {
        title: 'Crear Formulario',
        href: '/admin/business-forms/create',
    },
];

export default function CreateBusinessForm({ businesses, businessScope, preselectedBusinessId, flash }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const { data, setData, post, processing, errors, reset } = useForm({
        business_id: preselectedBusinessId ? preselectedBusinessId.toString() : '',
        name: '',
        description: '',
        is_active: true,
        settings: {},
    });

    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Mostrar toasts para mensajes flash
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasPermission('gestor-formularios-crear')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para crear formularios.',
                duration: 4000
            });
            return;
        }

        post(route('admin.business-forms.store'), {
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: 'Formulario creado',
                    message: 'El formulario ha sido creado exitosamente.',
                    duration: 3000
                });
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo crear el formulario. Verifica los datos ingresados.',
                    duration: 4000
                });
            }
        });
    };

    const handleCancel = () => {
        router.visit(route('admin.business-forms.index'));
    };

    // Filtrar negocios según el scope del usuario
    const availableBusinesses = businessScope.is_admin
        ? businesses
        : businesses.filter(business =>
            businessScope.business_ids.includes(business.id)
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Formulario Dinámico" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                            Crear Formulario Dinámico
                                        </h1>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Configura un nuevo formulario personalizado para un negocio
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Nuevo Formulario
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Info className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-medium text-gray-900">
                                    Información Básica
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Negocio */}
                                <div className="md:col-span-2">
                                    <Label htmlFor="business_id" className="text-sm font-medium text-gray-700">
                                        Negocio <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="business_id"
                                        value={data.business_id}
                                        onChange={(e) => setData('business_id', e.target.value)}
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                            errors.business_id ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Selecciona un negocio</option>
                                        {availableBusinesses.map((business) => (
                                            <option key={business.id} value={business.id}>
                                                {business.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.business_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.business_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        El formulario será específico para este negocio
                                    </p>
                                </div>

                                {/* Nombre */}
                                <div>
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                        Nombre del Formulario <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ej: Formulario de Visita PDV"
                                        className={`mt-1 ${
                                            errors.name ? 'border-red-300' : ''
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Estado */}
                                <div>
                                    <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                        Estado
                                    </Label>
                                    <div className="mt-1 flex items-center gap-3">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <span className="text-sm text-gray-600">
                                            {data.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Los formularios inactivos no estarán disponibles para los vendedores
                                    </p>
                                </div>

                                {/* Descripción */}
                                <div className="md:col-span-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe el propósito y contenido del formulario..."
                                        rows={3}
                                        className={`mt-1 ${
                                            errors.description ? 'border-red-300' : ''
                                        }`}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Opcional. Ayuda a identificar el propósito del formulario
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Información Adicional */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Building className="w-5 h-5 text-green-600" />
                                <h2 className="text-lg font-medium text-gray-900">
                                    Configuración Adicional
                                </h2>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-900">
                                            Próximos pasos
                                        </h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Una vez creado el formulario, podrás:
                                        </p>
                                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                            <li>• Agregar secciones para organizar los campos</li>
                                            <li>• Crear campos personalizados (texto, números, imágenes, etc.)</li>
                                            <li>• Asignar el formulario a PDVs específicos</li>
                                            <li>• Configurar validaciones y reglas</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Acciones */}
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => reset()}
                                    disabled={processing}
                                >
                                    Limpiar
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing || !data.business_id || !data.name}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creando...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Save className="w-4 h-4" />
                                            Crear Formulario
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

