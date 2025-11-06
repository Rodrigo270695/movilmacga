import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Clock, ArrowRight, MapPin, User, Building2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
}

interface Zonal {
    id: number;
    name: string;
    business?: {
        id: number;
        name: string;
    };
}

interface ChangeRequest {
    id: number;
    pdv_id: number;
    user_id: number;
    zonal_id: number;
    status: 'pending';
    reason: string | null;
    created_at: string;
    pdv: Pdv;
    user: User;
    zonal: Zonal;
}

interface PdvChangeRequestsWidgetProps {
    todayRequests: ChangeRequest[];
    totalPending: number;
    userPermissions: string[];
}

export function PdvChangeRequestsWidget({ 
    todayRequests, 
    totalPending,
    userPermissions 
}: PdvChangeRequestsWidgetProps) {
    const hasPermission = userPermissions.includes('gestor-pdv-aprobaciones-ver');

    // Si no tiene permisos, no mostrar el widget
    if (!hasPermission) {
        return null;
    }

    // Si no hay solicitudes, mostrar un mensaje
    if (totalPending === 0) {
        return (
            <Card className="bg-white border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <FileCheck className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    Aprobaciones PDV
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Solicitudes de hoy
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                            Sin pendientes
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 text-center py-4">
                        No hay solicitudes pendientes para hoy
                    </p>
                </div>
            </Card>
        );
    }

    // Mostrar las primeras 5 solicitudes
    const displayRequests = todayRequests.slice(0, 5);
    const hasMore = totalPending > displayRequests.length;

    return (
        <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                Aprobaciones PDV
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Solicitudes pendientes de hoy
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant="secondary" 
                        className="bg-amber-100 text-amber-700 border-amber-200 text-xs sm:text-sm"
                    >
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {totalPending} {totalPending === 1 ? 'pendiente' : 'pendientes'}
                    </Badge>
                </div>

                {/* Lista de solicitudes - Desktop */}
                <div className="hidden sm:block space-y-3 mb-4">
                    {displayRequests.map((request) => (
                        <div
                            key={request.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {request.pdv.point_name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">
                                            {request.user.first_name} {request.user.last_name}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <Building2 className="w-3 h-3" />
                                        <span className="truncate">{request.zonal.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lista de solicitudes - Mobile */}
                <div className="sm:hidden space-y-2 mb-4">
                    {displayRequests.map((request) => (
                        <div
                            key={request.id}
                            className="p-2.5 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <p className="text-sm font-medium text-gray-900 truncate flex-1">
                                    {request.pdv.point_name}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {request.user.first_name} {request.user.last_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{request.zonal.name}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer con botón */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600">
                        {hasMore && (
                            <span>
                                Mostrando {displayRequests.length} de {totalPending} solicitudes
                            </span>
                        )}
                        {!hasMore && (
                            <span>
                                {totalPending} {totalPending === 1 ? 'solicitud' : 'solicitudes'} pendiente{totalPending > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                    <Link
                        href={route('dcs.pdv-change-requests.index', { status: 'pending' })}
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        Ver todas
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                </div>
            </div>
        </Card>
    );
}
