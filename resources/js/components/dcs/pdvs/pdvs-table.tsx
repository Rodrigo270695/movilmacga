import { usePage } from '@inertiajs/react';
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
import { useToast } from '@/components/ui/toast';
import {
    Edit2,
    Power,
    Trash2,
    MapPin,
    CreditCard
} from 'lucide-react';

interface PdvModel {
    id: number;
    point_name: string;
    pos_id?: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    client_name: string;
    phone: string;
    classification: string;
    status: string;
    sells_recharge: boolean;
    address: string;
    latitude: number;
    longitude: number;
    route_id: number;
    district_id: number;
    locality: string;
    created_at: string;
    updated_at: string;
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
    district?: {
        id: number;
        name: string;
        provincia?: {
            id: number;
            name: string;
        };
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
            'pusher': { color: 'bg-red-100 text-red-800', label: 'Pusher' },
            'minimarket': { color: 'bg-yellow-100 text-yellow-800', label: 'Minimarket' },
            'botica': { color: 'bg-pink-100 text-pink-800', label: 'Bótica' },
            'farmacia': { color: 'bg-green-100 text-green-800', label: 'Farmacia' },
            'tambo': { color: 'bg-blue-100 text-blue-800', label: 'Tambo' },
            'cencosud': { color: 'bg-purple-100 text-purple-800', label: 'Cencosud' }
        };

        const config = classificationConfig[classification as keyof typeof classificationConfig] || classificationConfig['desconocida'];

        return (
            <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
            </Badge>
        );
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
                                            {pdv.locality}
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
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {hasPermission('gestor-pdv-editar') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(pdv)}
                                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                                                title="Editar PDV"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                        )}
                                        {hasPermission('gestor-pdv-cambiar-estado') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onToggleStatus(pdv)}
                                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer"
                                                title="Cambiar Estado"
                                            >
                                                <Power className="w-4 h-4 text-green-600" />
                                            </Button>
                                        )}
                                        {hasPermission('gestor-pdv-eliminar') && onDelete && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(pdv)}
                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                                title="Eliminar PDV"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
