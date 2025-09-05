import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, CircuitBoard, Calendar, TrendingUp, Navigation, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
    notes?: string;
    user: User;
    active_circuit?: Circuit;
}

interface MapData {
    session_start: {
        latitude: number;
        longitude: number;
        time: string;
        date: string;
    };
    session_end?: {
        latitude: number;
        longitude: number;
        time: string;
        date: string;
    };
    gps_track: Array<{
        latitude: number;
        longitude: number;
        recorded_at: string;
        speed: number;
        accuracy: number;
    }>;
    pdv_visits: Array<{
        id: number;
        pdv_name: string;
        client_name: string;
        latitude: number;
        longitude: number;
        check_in_at: string;
        visit_status: string;
    }>;
}

interface WorkingSessionMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: WorkingSession;
}

export function WorkingSessionMapModal({ isOpen, onClose, session }: WorkingSessionMapModalProps) {
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos del mapa cuando se abre el modal
    useEffect(() => {
        if (isOpen && session) {
            loadMapData();
        }
    }, [isOpen, session]);

    const loadMapData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/reportes/jornadas-laborales/${session.id}/mapa`);

            if (response.data.success) {
                setMapData(response.data.map_data);
            } else {
                setError('No se pudieron cargar los datos del mapa');
            }
        } catch (err) {
            console.error('Error loading map data:', err);
            setError('Error al cargar los datos del mapa');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para obtener el color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Función para obtener el ícono del estado
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Clock className="w-3 h-3" />;
            case 'completed':
                return <Calendar className="w-3 h-3" />;
            case 'paused':
                return <Navigation className="w-3 h-3" />;
            case 'cancelled':
                return <Clock className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full mx-auto h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4">
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        Mapa de Jornada Laboral
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Ruta completa de la jornada de {session.user.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col lg:flex-row gap-4">
                        {/* Información de la jornada */}
                        <div className="w-full lg:w-80 bg-gray-50 rounded-lg p-4 border border-gray-200 flex-shrink-0 overflow-y-auto">
                            <div className="space-y-4">
                                {/* Información del usuario */}
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        <h4 className="font-medium text-gray-900">Usuario</h4>
                                    </div>
                                    <p className="text-sm text-gray-700">{session.user.name}</p>
                                    <p className="text-xs text-gray-500">ID: {session.user.id}</p>
                                </div>

                                {/* Información de la jornada */}
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        <h4 className="font-medium text-gray-900">Jornada</h4>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Inicio:</span>
                                            <span className="font-medium">{session.formatted_start_time}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Fecha:</span>
                                            <span className="font-medium">{session.formatted_start_date}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Duración:</span>
                                            <span className="font-medium">{session.duration_formatted}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Estado:</span>
                                            <Badge className={`${getStatusColor(session.status)} text-xs`}>
                                                {getStatusIcon(session.status)}
                                                {session.status_label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Circuito */}
                                {session.active_circuit && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CircuitBoard className="w-4 h-4 text-green-600" />
                                            <h4 className="font-medium text-gray-900">Circuito</h4>
                                        </div>
                                        <p className="text-sm text-gray-700">{session.active_circuit.name}</p>
                                        {session.active_circuit.zonal && (
                                            <p className="text-xs text-gray-500">{session.active_circuit.zonal.name}</p>
                                        )}
                                    </div>
                                )}

                                {/* Métricas */}
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-orange-600" />
                                        <h4 className="font-medium text-gray-900">Métricas</h4>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">PDVs Visitados:</span>
                                            <span className="font-medium">{session.total_pdvs_visited}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Distancia:</span>
                                            <span className="font-medium">
                                                {session.total_distance_km ? `${session.total_distance_km.toFixed(1)} km` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Punto de inicio */}
                                {mapData?.session_start && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-green-600" />
                                            <h4 className="font-medium text-gray-900">Punto de Inicio</h4>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Hora:</span>
                                                <span className="font-medium">{mapData.session_start.time}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Coordenadas:</span>
                                                <span className="font-mono text-xs">
                                                    {mapData.session_start.latitude.toFixed(6)}, {mapData.session_start.longitude.toFixed(6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Punto de fin */}
                                {mapData?.session_end && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-red-600" />
                                            <h4 className="font-medium text-gray-900">Punto de Fin</h4>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Hora:</span>
                                                <span className="font-medium">{mapData.session_end.time}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Coordenadas:</span>
                                                <span className="font-mono text-xs">
                                                    {mapData.session_end.latitude.toFixed(6)}, {mapData.session_end.longitude.toFixed(6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Visitas PDV */}
                                {mapData?.pdv_visits && mapData.pdv_visits.length > 0 && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <h4 className="font-medium text-gray-900">Visitas PDV</h4>
                                        </div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {mapData.pdv_visits.map((visit) => (
                                                <div key={visit.id} className="text-xs border-l-2 border-blue-200 pl-2">
                                                    <div className="font-medium text-gray-700">{visit.pdv_name}</div>
                                                    <div className="text-gray-500">{visit.check_in_at}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Estado de carga */}
                                {isLoading && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-gray-600">Cargando datos del mapa...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <div className="flex items-center gap-2">
                                            <X className="w-4 h-4 text-red-600" />
                                            <span className="text-sm text-red-600">{error}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mapa */}
                        <div className="flex-1 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="h-full flex items-center justify-center">
                                {isLoading ? (
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-sm text-gray-600">Cargando mapa...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Error al cargar el mapa</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={loadMapData}
                                            className="mt-2"
                                        >
                                            Reintentar
                                        </Button>
                                    </div>
                                ) : mapData ? (
                                    <div className="w-full h-full bg-white flex items-center justify-center">
                                        <div className="text-center">
                                            <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Mapa de Ruta
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Aquí se mostraría el mapa interactivo con la ruta completa
                                            </p>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p>• Punto de inicio: {mapData.session_start.latitude.toFixed(6)}, {mapData.session_start.longitude.toFixed(6)}</p>
                                                {mapData.session_end && (
                                                    <p>• Punto de fin: {mapData.session_end.latitude.toFixed(6)}, {mapData.session_end.longitude.toFixed(6)}</p>
                                                )}
                                                <p>• Puntos GPS: {mapData.gps_track.length}</p>
                                                <p>• Visitas PDV: {mapData.pdv_visits.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">No hay datos de mapa disponibles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="cursor-pointer"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
