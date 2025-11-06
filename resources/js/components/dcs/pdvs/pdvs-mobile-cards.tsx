import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    MapPin,
    Phone,
    User,
    Building2,
    Route,
    MoreVertical,
    Edit,
    ToggleLeft,
    Navigation
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    onViewOnMap?: (pdv: PdvModel) => void;
}

export function PdvsMobileCards({
    pdvs,
    onEdit,
    onToggleStatus,
    onViewOnMap
}: Props) {
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleCardExpansion = (pdvId: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pdvId)) {
                newSet.delete(pdvId);
            } else {
                newSet.add(pdvId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'vende':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'no vende':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'no existe':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'pdv autoactivado':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'pdv impulsador':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'vende':
                return 'Vende';
            case 'no vende':
                return 'No Vende';
            case 'no existe':
                return 'No Existe';
            case 'pdv autoactivado':
                return 'Autoactivado';
            case 'pdv impulsador':
                return 'Impulsador';
            default:
                return status;
        }
    };

    const getClassificationIcon = (classification: string) => {
        switch (classification) {
            case 'telecomunicaciones':
                return '📱';
            case 'chalequeros':
                return '👥';
            case 'bodega':
                return '🏪';
            case 'otras tiendas':
                return '🏬';
            case 'pusher':
                return '📢';
            case 'minimarket':
                return '🛒';
            case 'botica':
                return '💊';
            case 'farmacia':
                return '🏥';
            case 'tambo':
                return '🥛';
            case 'cencosud':
                return '🏢';
            default:
                return '🏪';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (!pdvs.data || pdvs.data.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay PDVs</h3>
                <p className="text-gray-500">No se encontraron PDVs con los filtros aplicados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {pdvs.data.map((pdv) => {
                const isExpanded = expandedCards.has(pdv.id);
                const hasCoordinates = pdv.latitude && pdv.longitude;

                return (
                    <Card
                        key={pdv.id}
                        className="overflow-hidden hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                        <CardContent className="p-0">
                            {/* Header de la Card */}
                            <div className="p-4 pb-3">
                                <div className="flex items-start justify-between">
                                    {/* Información Principal */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="h-10 w-10 bg-blue-100">
                                                <AvatarFallback className="text-blue-600 font-semibold">
                                                    {getInitials(pdv.point_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {pdv.point_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {pdv.client_name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Badges de Estado y Clasificación */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge
                                                className={`text-xs font-medium ${getStatusColor(pdv.status)}`}
                                            >
                                                {getStatusLabel(pdv.status)}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {getClassificationIcon(pdv.classification)} {pdv.classification}
                                            </Badge>
                                            {pdv.sells_recharge && (
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    🔋 Recargas
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Información Básica */}
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>{pdv.document_type}: {pdv.document_number}</span>
                                            </div>
                                            {pdv.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span>{pdv.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="truncate">{pdv.locality}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menú de Acciones */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onEdit(pdv)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar PDV
                                            </DropdownMenuItem>
                                            {hasCoordinates && onViewOnMap && (
                                                <DropdownMenuItem onClick={() => onViewOnMap(pdv)}>
                                                    <Navigation className="w-4 h-4 mr-2" />
                                                    Ver en Mapa
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onToggleStatus(pdv)}
                                                className="text-orange-600"
                                            >
                                                <ToggleLeft className="w-4 h-4 mr-2" />
                                                Cambiar Estado
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Información Expandible */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t bg-gray-50/50">
                                    <div className="pt-3 space-y-3">
                                        {/* Información de Ruta */}
                                        {pdv.route && (
                                            <div className="bg-white rounded-lg p-3 border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Route className="w-4 h-4 text-blue-500" />
                                                    <span className="font-medium text-gray-900">Asignación de Ruta</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Ruta:</span>
                                                        <span className="font-medium">{pdv.route.name} ({pdv.route.code})</span>
                                                    </div>
                                                    {pdv.route.circuit && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Circuito:</span>
                                                            <span className="font-medium">{pdv.route.circuit.name}</span>
                                                        </div>
                                                    )}
                                                    {pdv.route.circuit?.zonal && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Zonal:</span>
                                                            <span className="font-medium">{pdv.route.circuit.zonal.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Información Geográfica */}
                                        {pdv.district && (
                                            <div className="bg-white rounded-lg p-3 border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-4 h-4 text-green-500" />
                                                    <span className="font-medium text-gray-900">Ubicación</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Distrito:</span>
                                                        <span className="font-medium">{pdv.district.name}</span>
                                                    </div>
                                                    {pdv.district.provincia && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Provincia:</span>
                                                            <span className="font-medium">{pdv.district.provincia.name}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Localidad:</span>
                                                        <span className="font-medium">{pdv.locality}</span>
                                                    </div>
                                                    {hasCoordinates && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Coordenadas:</span>
                                                            <span className="font-mono text-xs">
                                                                {pdv.latitude.toFixed(6)}, {pdv.longitude.toFixed(6)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Información de Contacto */}
                                        <div className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-purple-500" />
                                                <span className="font-medium text-gray-900">Información de Contacto</span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Cliente:</span>
                                                    <span className="font-medium">{pdv.client_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Documento:</span>
                                                    <span className="font-medium">{pdv.document_type} {pdv.document_number}</span>
                                                </div>
                                                {pdv.phone && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Teléfono:</span>
                                                        <span className="font-medium">{pdv.phone}</span>
                                                    </div>
                                                )}
                                                {pdv.pos_id && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">ID POS:</span>
                                                        <span className="font-mono font-medium">{pdv.pos_id}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Información de Dirección */}
                                        {pdv.address && (
                                            <div className="bg-white rounded-lg p-3 border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-4 h-4 text-orange-500" />
                                                    <span className="font-medium text-gray-900">Dirección</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{pdv.address}</p>
                                                {pdv.reference && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        <span className="font-medium">Referencia:</span> {pdv.reference}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Fechas */}
                                        <div className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium text-gray-900">Fechas</span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Creado:</span>
                                                    <span className="font-medium">{formatDate(pdv.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Actualizado:</span>
                                                    <span className="font-medium">{formatDate(pdv.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer con Botón de Expansión */}
                            <div className="px-4 py-3 bg-gray-50 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Building2 className="w-3 h-3" />
                                        <span>ID: {pdv.id}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleCardExpansion(pdv.id)}
                                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        {isExpanded ? 'Ver menos' : 'Ver más'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
