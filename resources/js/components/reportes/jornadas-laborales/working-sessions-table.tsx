import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, MapPin, User, CircuitBoard, Calendar, TrendingUp, Navigation } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal?: {
        id: number;
        name: string;
    };
}

interface Route {
    id: number;
    name: string;
    code: string;
}

interface WorkingSession {
    id: number;
    started_at: string;
    ended_at?: string;
    status: string;
    status_label: string;
    total_distance_km?: number;
    total_pdvs_visited: number;
    total_duration_minutes?: number;
    duration_formatted: string;
    formatted_start_time: string;
    formatted_start_date: string;
    formatted_end_time?: string;
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
    notes?: string;
    user: User;
    active_circuit?: Circuit;
    assigned_route?: Route;
    route_pdvs_count: number;
    visited_pdvs_count: number;
}

interface PaginatedSessions {
    data: WorkingSession[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface WorkingSessionsTableProps {
    sessions: PaginatedSessions;
    userPermissions: string[];
    onViewPdvRoute?: (route: Route, visitDate: string, userId: number, workingSession?: any) => void;
}

export function WorkingSessionsTable({ sessions, userPermissions, onViewPdvRoute }: WorkingSessionsTableProps) {
    // Función para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Función para obtener el color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-50';
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-50';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-50';
        }
    };

    // Función para obtener el ícono del estado
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Clock className="w-3 h-3" />;
            case 'completed':
                return <Calendar className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <Card className="overflow-hidden">
            {/* Header de la tabla */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Jornadas Laborales</h3>
                            <p className="text-xs text-gray-500">
                                {sessions.total} jornadas encontradas
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vista Desktop - Tabla */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Horarios
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ruta Asignada
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duración
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PDVs Ruta
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Distancia
                            </th>

                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.data.map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50">
                                {/* Usuario */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {session.user.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ID: {session.user.id}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Horarios */}
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">Ini.</span>
                                                <span className="text-sm font-medium text-green-600">
                                                    {session.formatted_start_time}
                                                </span>
                                            </div>
                                            {session.formatted_end_time && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-500">Sal.</span>
                                                    <span className="text-sm font-medium text-red-600">
                                                        {session.formatted_end_time}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {session.formatted_start_date}
                                        </div>
                                    </div>
                                </td>

                                {/* Ruta Asignada */}
                                <td className="px-6 py-4 text-center">
                                    {session.assigned_route ? (
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1">
                                                <CircuitBoard className="w-3 h-3 text-blue-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.assigned_route.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {session.assigned_route.code}
                                            </div>
                                            {session.active_circuit && (
                                                <div className="text-xs text-blue-600">
                                                    {session.active_circuit.name}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-400">Sin ruta asignada</span>
                                            {session.active_circuit && (
                                                <div className="text-xs text-gray-500">
                                                    {session.active_circuit.name}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Estado */}
                                <td className="px-6 py-4 text-center">
                                    <Badge className={`${getStatusColor(session.status)} flex items-center gap-1 justify-center`}>
                                        {getStatusIcon(session.status)}
                                        {session.status_label}
                                    </Badge>
                                </td>

                                {/* Duración */}
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.duration_formatted}
                                        </span>
                                    </div>
                                </td>

                                {/* PDVs Ruta */}
                                <td className="px-6 py-4 text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => {
                                                        if (onViewPdvRoute && session.assigned_route) {
                                                            onViewPdvRoute(
                                                                session.assigned_route,
                                                                session.formatted_start_date,
                                                                session.user.id,
                                                                {
                                                                    id: session.id,
                                                                    start_latitude: session.start_latitude,
                                                                    start_longitude: session.start_longitude,
                                                                    end_latitude: session.end_latitude,
                                                                    end_longitude: session.end_longitude,
                                                                    started_at: session.started_at,
                                                                    ended_at: session.ended_at
                                                                }
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <MapPin className="w-3 h-3 text-blue-500 mr-1" />
                                                    <span className="text-sm font-medium">
                                                        <span className="text-blue-600">{session.route_pdvs_count}</span>
                                                        <span className="text-gray-500 mx-1">/</span>
                                                        <span className="text-green-600">{session.visited_pdvs_count}</span>
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <div className="text-center">
                                                    <p className="font-medium mb-2">PDVs de la Ruta</p>
                                                    <div className="flex items-center justify-center gap-3 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                                            <span>PDVs de la ruta</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                                            <span>PDVs visitados</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">Haz clic para ver el mapa</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>

                                {/* Distancia */}
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-purple-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.total_distance_km ? `${session.total_distance_km.toFixed(1)} km` : '-'}
                                        </span>
                                    </div>
                                </td>


                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Vista Mobile - Cards */}
            <div className="sm:hidden space-y-4 p-4">
                {sessions.data.map((session) => (
                    <Card key={session.id} className="p-4 space-y-3">
                        {/* Header de la card */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {session.user.name}
                                    </h4>
                                    <div className="text-xs text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <span className="text-green-600 font-medium">
                                                Ini. {session.formatted_start_time}
                                            </span>
                                            {session.formatted_end_time && (
                                                <span className="text-red-600 font-medium">
                                                    Sal. {session.formatted_end_time}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1">{session.formatted_start_date}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <Badge className={`${getStatusColor(session.status)} flex-shrink-0`}>
                                {getStatusIcon(session.status)}
                                {session.status_label}
                            </Badge>
                        </div>

                        {/* Ruta Asignada */}
                        <div className="flex items-center gap-1 text-xs">
                            <CircuitBoard className="w-3 h-3 text-blue-500" />
                            <span className="text-gray-500">Ruta:</span>
                            <span className="text-gray-900 font-medium">
                                {session.assigned_route ? `${session.assigned_route.name} (${session.assigned_route.code})` : 'Sin ruta asignada'}
                            </span>
                        </div>
                        {session.active_circuit && (
                            <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-500">Circuito:</span>
                                <span className="text-blue-600 font-medium">
                                    {session.active_circuit.name}
                                </span>
                            </div>
                        )}

                        {/* Métricas */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-500">Duración:</span>
                                <span className="text-gray-900 font-medium">{session.duration_formatted}</span>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 border-gray-200 hover:bg-gray-50 cursor-pointer text-xs"
                                            onClick={() => {
                                                if (onViewPdvRoute && session.assigned_route) {
                                                    onViewPdvRoute(
                                                        session.assigned_route,
                                                        session.formatted_start_date,
                                                        session.user.id,
                                                        {
                                                            id: session.id,
                                                            start_latitude: session.start_latitude,
                                                            start_longitude: session.start_longitude,
                                                            end_latitude: session.end_latitude,
                                                            end_longitude: session.end_longitude,
                                                            started_at: session.started_at,
                                                            ended_at: session.ended_at
                                                        }
                                                    );
                                                }
                                            }}
                                        >
                                            <MapPin className="w-3 h-3 text-blue-500 mr-1" />
                                            <span className="font-medium">
                                                <span className="text-blue-600">{session.route_pdvs_count}</span>
                                                <span className="text-gray-500 mx-1">/</span>
                                                <span className="text-green-600">{session.visited_pdvs_count}</span>
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <div className="text-center">
                                            <p className="font-medium mb-2">PDVs de la Ruta</p>
                                            <div className="flex items-center justify-center gap-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                                    <span>PDVs de la ruta</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                                    <span>PDVs visitados</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Haz clic para ver el mapa</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-1 text-xs">
                                <TrendingUp className="w-3 h-3 text-purple-500" />
                                <span className="text-gray-500">Distancia:</span>
                                <span className="text-gray-900 font-medium">
                                    {session.total_distance_km ? `${session.total_distance_km.toFixed(1)} km` : '-'}
                                </span>
                            </div>
                        </div>


                    </Card>
                ))}
            </div>

            {/* Mensaje cuando no hay jornadas */}
            {sessions.data.length === 0 && (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay jornadas laborales
                    </h3>
                    <p className="text-gray-500">
                        No se encontraron jornadas laborales con los filtros aplicados.
                    </p>
                </div>
            )}
        </Card>
    );
}
