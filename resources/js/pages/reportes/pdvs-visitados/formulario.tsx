import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    FileText,
    Image,
    Map,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    username: string;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    classification: string;
    status: string;
}

interface FormResponse {
    id: number;
    response_value: string | null;
    response_file: string | null;
    response_location: any | null;
    response_signature: string | null;
    response_metadata: any | null;
    field_label: string;
    field_type: string;
    section_name: string;
}

interface Visit {
    id: number;
    check_in_at: string;
    check_out_at?: string;
    visit_status: 'in_progress' | 'completed' | 'cancelled';
    duration_minutes?: number;
    distance_to_pdv?: number;
    latitude: number;
    longitude: number;
    notes?: string;
    visit_photo?: string;
    user: User;
    pdv: Pdv;
}

interface Props {
    visit: Visit;
    responsesBySection: Record<string, FormResponse[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reportes',
        href: '#',
    },
    {
        title: 'PDVs Visitados',
        href: '/reportes/pdvs-visitados',
    },
    {
        title: 'Formulario de Visita',
        href: '#',
    },
];

export default function PdvVisitFormulario({ visit, responsesBySection }: Props) {
    const getEstadoBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completada
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En Progreso
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelada
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                        Desconocido
                    </Badge>
                );
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDistance = (meters?: number) => {
        if (!meters) return 'N/A';
        return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
    };

    const renderResponseValue = (response: FormResponse) => {
        const { field_type, field_label } = response;
        const { response_value, response_file, response_location, response_signature } = response;

        switch (field_type) {
            case 'text':
            case 'textarea':
            case 'number':
            case 'email':
            case 'phone':
            case 'select':
            case 'radio':
            case 'checkbox':
                return (
                    <div className="text-sm">
                        <span className="font-medium text-gray-900">
                            {response_value ? response_value : 'Sin respuesta'}
                        </span>
                    </div>
                );

            case 'file':
            case 'image':
                if (response_file) {
                    // Extraer nombre del archivo de la URL
                    const fileName = response_file.split('/').pop() || 'Archivo';
                    return (
                        <div className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-blue-500" />
                            <a
                                href={response_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Ver {fileName}
                            </a>
                        </div>
                    );
                }
                return <span className="text-sm text-gray-500">Sin archivo</span>;

            case 'location':
                if (response_location) {
                    return (
                        <div className="flex items-center gap-2">
                            <Map className="w-4 h-4 text-green-500" />
                            <span className="text-sm">
                                {response_location.lat}, {response_location.lng}
                            </span>
                        </div>
                    );
                }
                return <span className="text-sm text-gray-500">Sin ubicación</span>;

            case 'signature':
                // Las firmas pueden estar en response_file o response_signature
                const signatureFile = response_signature || response_file;
                if (signatureFile) {
                    // Extraer nombre del archivo de la URL
                    const fileName = signatureFile.split('/').pop() || 'Firma';
                    return (
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            <a
                                href={signatureFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-800 underline"
                            >
                                Ver {fileName}
                            </a>
                        </div>
                    );
                }
                return <span className="text-sm text-gray-500">Sin firma</span>;

            default:
                return <span className="text-sm text-gray-500">Tipo no soportado</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Formulario de Visita - ${visit.pdv.point_name}`} />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6">
                <div className="space-y-6">

                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit('/reportes/pdvs-visitados')}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl font-semibold text-gray-900">
                                            Formulario de Visita
                                        </h1>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Respuestas del formulario completado durante la visita
                                        </p>

                                    </div>
                                </div>
                                {getEstadoBadge(visit.visit_status)}
                            </div>
                        </div>
                    </div>

                    {/* Información de la visita */}
                    <Card className="border border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Información de la Visita
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Vendedor */}
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{visit.user.name}</p>
                                        <p className="text-xs text-gray-500">@{visit.user.username}</p>
                                    </div>
                                </div>

                                {/* PDV */}
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{visit.pdv.point_name}</p>
                                        <p className="text-xs text-gray-500">{visit.pdv.client_name}</p>
                                    </div>
                                </div>

                                {/* Fecha y hora */}
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-purple-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDateTime(visit.check_in_at)}
                                        </p>
                                        <p className="text-xs text-gray-500">Check-in</p>
                                    </div>
                                </div>

                                {/* Duración */}
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDuration(visit.duration_minutes)}
                                        </p>
                                        <p className="text-xs text-gray-500">Duración</p>
                                    </div>
                                </div>

                                {/* Distancia */}
                                <div className="flex items-center gap-3">
                                    <Map className="w-5 h-5 text-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDistance(visit.distance_to_pdv)}
                                        </p>
                                        <p className="text-xs text-gray-500">Distancia al PDV</p>
                                    </div>
                                </div>

                                {/* Check-out */}
                                {visit.check_out_at && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatDateTime(visit.check_out_at)}
                                            </p>
                                            <p className="text-xs text-gray-500">Check-out</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {visit.notes && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Observaciones:</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                        {visit.notes}
                                    </p>
                                </div>
                            )}

                            {/* Foto de evidencia */}
                            {visit.visit_photo && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Foto de evidencia:</h4>
                                    <a
                                        href={visit.visit_photo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        <Image className="w-4 h-4" />
                                        Ver foto
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Respuestas del formulario */}
                    {Object.keys(responsesBySection).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(responsesBySection).map(([sectionName, responses]) => (
                                <Card key={sectionName} className="border border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-gray-900">
                                            {sectionName}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {responses.map((response) => (
                                                <div key={response.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                                {response.field_label || 'Campo sin nombre'}
                                                            </h4>
                                                            <div className="text-xs text-gray-500 mb-2">
                                                                Tipo: {response.field_type || 'desconocido'}
                                                            </div>
                                                            {renderResponseValue(response)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-gray-200">
                            <CardContent className="p-8">
                                <div className="text-center">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No hay respuestas de formulario
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Esta visita no tiene respuestas de formulario registradas.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
