import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    MapPin,
    User,
    Calendar,
    Map,
    FileText,
    Trash2
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDeleteModal } from './confirm-delete-modal';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
}

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    classification: string;
    status: string;
}

interface PdvVisit {
    id: number;
    check_in_at: string;
    check_out_at?: string;
    visit_status: 'in_progress' | 'completed' | 'cancelled';
    duration_minutes?: number;
    distance_to_pdv?: number;
    latitude: number;
    longitude: number;
    used_mock_location?: boolean | null;
    user: User;
    pdv: Pdv;
}

interface PaginatedVisitas {
    data: PdvVisit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface PdvVisitadosTableProps {
    visitas: PaginatedVisitas;
}

export function PdvVisitadosTable({ visitas }: PdvVisitadosTableProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedVisita, setSelectedVisita] = useState<PdvVisit | null>(null);

    const handleDeleteVisit = (visita: PdvVisit) => {
        setSelectedVisita(visita);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setSelectedVisita(null);
    };
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

    const formatDuration = (visita: PdvVisit) => {
        let minutes: number | null | undefined = visita.duration_minutes;

        if ((minutes === null || minutes === undefined) && visita.check_out_at) {
            const checkIn = new Date(visita.check_in_at).getTime();
            const checkOut = new Date(visita.check_out_at).getTime();

            if (!Number.isNaN(checkIn) && !Number.isNaN(checkOut)) {
                const diffMinutes = Math.floor((checkOut - checkIn) / 60000);
                minutes = diffMinutes >= 0 ? diffMinutes : 0;
            }
        }

        if (minutes === null || minutes === undefined) {
            return 'N/A';
        }

        const totalMinutes = Math.max(0, Math.round(minutes));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }

        return `${mins}m`;
    };

    const formatDistance = (meters?: number) => {
        if (!meters) return 'N/A';
        return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
    };

    const getMockLocationBadge = (usedMockLocation?: boolean | null) => {
        if (usedMockLocation) {
            return (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                    Mock detectado
                </Badge>
            );
        }

        if (usedMockLocation === false) {
            return (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    Ubicación real
                </Badge>
            );
        }

        return (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                Sin dato
            </Badge>
        );
    };


    if (visitas.data.length === 0) {
        return (
            <Card className="border border-gray-200">
                <CardContent className="p-8">
                    <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay visitas registradas
                        </h3>
                        <p className="text-gray-600 text-sm">
                            No se encontraron visitas a PDVs con los filtros aplicados.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
            {/* Tabla Desktop */}
            <div className="hidden lg:block">
                <Card className="border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Lista de Visitas a PDVs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Fecha/Hora</TableHead>
                                    <TableHead className="w-[200px]">Vendedor</TableHead>
                                    <TableHead className="w-[250px]">PDV</TableHead>
                                    <TableHead className="w-[100px]">Estado Visita</TableHead>
                                    <TableHead className="w-[140px]">Mock Location</TableHead>
                                    <TableHead className="w-[100px]">Duración</TableHead>
                                    <TableHead className="w-[100px]">Distancia</TableHead>
                                    <TableHead className="w-[120px]">Check-out</TableHead>
                                    <TableHead className="w-[100px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visitas.data.map((visita) => (
                                    <TableRow key={visita.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">
                                                        {formatDateTime(visita.check_in_at).split(',')[0]}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDateTime(visita.check_in_at).split(',')[1]}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {visita.user.first_name} {visita.user.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {visita.user.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-green-500" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {visita.pdv.point_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {visita.pdv.client_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getEstadoBadge(visita.visit_status)}
                                        </TableCell>
                                        <TableCell>
                                            {getMockLocationBadge(visita.used_mock_location)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm">{formatDuration(visita)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Map className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm">{formatDistance(visita.distance_to_pdv)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {visita.check_out_at ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">
                                                        {formatDateTime(visita.check_out_at).split(',')[0]}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDateTime(visita.check_out_at).split(',')[1]}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Pendiente</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(`/reportes/pdvs-visitados/${visita.id}/formulario`)}
                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                                                    title="Ver formulario"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>

                                                {/* Botón eliminar - Solo para visitas en progreso */}
                                                {visita.visit_status === 'in_progress' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteVisit(visita)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                                                        title="Eliminar visita"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Cards Mobile */}
            <div className="lg:hidden space-y-3">
                {visitas.data.map((visita) => (
                    <Card key={visita.id} className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {/* Header con fecha y estado */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDateTime(visita.check_in_at)}
                                        </span>
                                    </div>
                                    {getEstadoBadge(visita.visit_status)}
                                </div>

                                {/* Vendedor */}
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {visita.user.first_name} {visita.user.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {visita.user.username}
                                        </div>
                                    </div>
                                </div>

                                {/* PDV */}
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-500" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {visita.pdv.point_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {visita.pdv.client_name}
                                        </div>
                                        <div className="mt-1">
                                            {getMockLocationBadge(visita.used_mock_location)}
                                        </div>
                                    </div>
                                </div>

                                {/* Métricas */}
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">
                                            {formatDuration(visita)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Map className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">
                                            {formatDistance(visita.distance_to_pdv)}
                                        </span>
                                    </div>
                                </div>

                                {/* Check-out */}
                                {visita.check_out_at && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="text-xs text-gray-500">
                                            Check-out: {formatDateTime(visita.check_out_at)}
                                        </div>
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.visit(`/reportes/pdvs-visitados/${visita.id}/formulario`)}
                                            className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Ver Formulario
                                        </Button>

                                        {visita.visit_status === 'in_progress' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteVisit(visita)}
                                                className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar Visita
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>


        </div>

        {/* Modal de confirmación de eliminación */}
        <ConfirmDeleteModal
            open={deleteModalOpen}
            onClose={handleCloseDeleteModal}
            visita={selectedVisita}
        />
        </>
    );
}
