import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import {
    Edit2,
    MoreVertical,
    Power,
    Trash2,
    MapPin,
    Phone,
    Mail,
    Building2,
    CreditCard
} from 'lucide-react';
// Usando componente DropdownMenu personalizado para evitar bucles infinitos de Radix UI
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
import { CustomDropdownMenu } from '@/components/ui/custom-dropdown-menu';

interface PdvModel {
    id: number;
    point_name: string;
    pos_id?: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    client_name: string;
    classification: string;
    status: string;
    route_id: number;
    locality_id: number;
    created_at: string;
    route?: {
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
    };
    locality?: {
        id: number;
        name: string;
    };
}

interface Props {
    pdvs: {
        data: PdvModel[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    onEdit: (pdv: PdvModel) => void;
    onToggleStatus: (pdv: PdvModel) => void;
    onDelete?: (pdv: PdvModel) => void;
    isGlobalView?: boolean;
}

export function PdvsTable({ pdvs, onEdit, onToggleStatus, onDelete, isGlobalView = false }: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'vende': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Vende' },
            'no vende': { color: 'bg-red-100 text-red-800 border-red-200', label: 'No Vende' },
            'no existe': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'No Existe' },
            'pdv autoactivado': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Autoactivado' },
            'pdv impulsador': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Impulsador' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['no vende'];

        return (
            <Badge className={`${config.color} text-xs font-medium border`}>
                {config.label}
            </Badge>
        );
    };

    const getClassificationBadge = (classification: string) => {
        const classificationConfig = {
            'telecomunicaciones': { color: 'bg-blue-100 text-blue-800', label: 'Telecomunicaciones' },
            'chalequeros': { color: 'bg-orange-100 text-orange-800', label: 'Chalequeros' },
            'bodega': { color: 'bg-green-100 text-green-800', label: 'Bodega' },
            'otras tiendas': { color: 'bg-purple-100 text-purple-800', label: 'Otras Tiendas' },
            'desconocida': { color: 'bg-gray-100 text-gray-800', label: 'Desconocida' },
            'pusher': { color: 'bg-red-100 text-red-800', label: 'Pusher' }
        };

        const config = classificationConfig[classification as keyof typeof classificationConfig] || classificationConfig['desconocida'];

        return (
            <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
            </Badge>
        );
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(route('dcs.pdvs.index'), {
            page,
            ...router.page.props.filters
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleDelete = (pdv: PdvModel) => {
        if (!hasPermission('gestor-pdv-eliminar')) {
            addToast({
                type: 'error',
                title: 'Sin permisos',
                message: 'No tienes permisos para eliminar PDVs.',
                duration: 4000
            });
            return;
        }

        if (onDelete) {
            onDelete(pdv);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderPagination = () => {
        if (pdvs.last_page <= 1) return null;

        const pages = [];
        const currentPage = pdvs.current_page;
        const lastPage = pdvs.last_page;

        // Lógica de paginación similar a rutas
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                    className="h-8 w-8 p-0"
                >
                    {i}
                </Button>
            );
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                <div className="text-sm text-gray-600">
                    Mostrando {pdvs.from} a {pdvs.to} de {pdvs.total} PDVs
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8"
                    >
                        Anterior
                    </Button>
                    <div className="flex gap-1">
                        {pages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === lastPage}
                        className="h-8"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        );
    };

    if (pdvs.data.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                    <MapPin className="w-12 h-12 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">No hay PDVs</h3>
                    <p className="text-gray-600 max-w-md">
                        No se encontraron puntos de venta que coincidan con los criterios de búsqueda.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="font-semibold text-gray-900">PDV</TableHead>
                            <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
                            <TableHead className="font-semibold text-gray-900">Documento</TableHead>
                            <TableHead className="font-semibold text-gray-900">Clasificación</TableHead>
                            <TableHead className="font-semibold text-gray-900">Estado</TableHead>
                            {isGlobalView && (
                                <TableHead className="font-semibold text-gray-900">Ubicación</TableHead>
                            )}
                            <TableHead className="font-semibold text-gray-900">Fecha</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pdvs.data.map((pdv) => (
                            <TableRow key={pdv.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900">
                                            {pdv.point_name}
                                        </div>
                                        {pdv.pos_id && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" />
                                                POS: {pdv.pos_id}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900">
                                            {pdv.client_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {pdv.locality?.name}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="font-mono text-sm">
                                            {pdv.document_number}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {pdv.document_type}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getClassificationBadge(pdv.classification)}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(pdv.status)}
                                </TableCell>
                                {isGlobalView && (
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {pdv.route?.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {pdv.route?.circuit?.name} • {pdv.route?.circuit?.zonal?.name}
                                            </div>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(pdv.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <CustomDropdownMenu
                                        align="end"
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        }
                                        items={[
                                            ...(hasPermission('gestor-pdv-editar') ? [{
                                                label: (
                                                    <span className="flex items-center">
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Editar PDV
                                                    </span>
                                                ) as any,
                                                onClick: () => onEdit(pdv)
                                            }] : []),
                                            ...(hasPermission('gestor-pdv-cambiar-estado') ? [{
                                                label: (
                                                    <span className="flex items-center">
                                                        <Power className="w-4 h-4 mr-2" />
                                                        Cambiar Estado
                                                    </span>
                                                ) as any,
                                                onClick: () => onToggleStatus(pdv)
                                            }] : []),
                                            ...(hasPermission('gestor-pdv-eliminar') ? [
                                                { type: 'separator' },
                                                {
                                                    label: (
                                                        <span className="flex items-center">
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Eliminar PDV
                                                        </span>
                                                    ) as any,
                                                    onClick: () => handleDelete(pdv),
                                                    variant: 'destructive'
                                                }
                                            ] : [])
                                        ].filter(Boolean)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
