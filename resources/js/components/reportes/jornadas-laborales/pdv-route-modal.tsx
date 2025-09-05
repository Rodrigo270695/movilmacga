import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { MapPin, Navigation, X, Loader2, Info } from 'lucide-react';
import axios from 'axios';

interface Pdv {
    id: number;
    point_name: string;
    client_name: string;
    pos_id: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    district_id?: number;
    locality?: string;
    district?: {
        name: string;
    };
    is_visited?: boolean;
}

interface Route {
    id: number;
    name: string;
    code: string;
}

interface WorkingSessionData {
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
    started_at: string;
    ended_at?: string;
    id?: number;
}

interface GpsTrackingPoint {
    id: number;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    battery_level?: number;
    is_mock_location: boolean;
    recorded_at: string;
}

interface PdvRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: Route | null;
    visitDate: string;
    userId: number;
    workingSession?: WorkingSessionData;
}

export function PdvRouteModal({ isOpen, onClose, route, visitDate, userId, workingSession }: PdvRouteModalProps) {
    const { addToast } = useToast();
    const [pdvs, setPdvs] = useState<Pdv[]>([]);
    const [gpsTracking, setGpsTracking] = useState<GpsTrackingPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);
    const [selectedMapType, setSelectedMapType] = useState<string>('streets');
    const [mapLayers, setMapLayers] = useState<any>({});

    // Cargar PDVs cuando se abre el modal
    useEffect(() => {
        if (isOpen && route) {
            loadPdvs();
        }
    }, [isOpen, route]);

    // Inicializar mapa cuando se cargan los PDVs
    useEffect(() => {
        if (pdvs.length > 0 && mapContainer && !map) {
            if (typeof window !== 'undefined' && window.L) {
                initializeMap();
            } else {
                console.warn('Leaflet no está disponible');
                setMapError('Leaflet no está disponible');
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo cargar el mapa. Leaflet no está disponible.',
                    duration: 4000
                });
            }
        }
    }, [pdvs, mapContainer, map]);

    // Actualizar marcadores cuando cambian los PDVs o GPS tracking
    useEffect(() => {
        if (map && pdvs.length > 0) {
            updateMarkers();
        }
    }, [pdvs, map, gpsTracking]);

    // Forzar refresh del mapa cuando el modal se abre
    useEffect(() => {
        if (isOpen && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        }
    }, [isOpen, map]);

    const loadPdvs = async () => {
        if (!route) return;

        setLoading(true);
        try {
            // Obtener PDVs de la ruta
            const routeResponse = await axios.get(`/dcs/routes/${route.id}/pdvs`);
            const routePdvs = routeResponse.data.pdvs || [];

            // Convertir fecha de dd/mm/yyyy a yyyy-mm-dd
            const dateParts = visitDate.split('/');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

            // Obtener PDVs visitados en la fecha específica
            const visitedResponse = await axios.get(`/reportes/jornadas-laborales/pdv-visits`, {
                params: {
                    user_id: userId,
                    visit_date: formattedDate,
                    route_id: route.id
                }
            });
            const visitedPdvs = visitedResponse.data.visits || [];

            // Marcar PDVs como visitados
            const pdvsWithVisitStatus = routePdvs.map((pdv: Pdv) => ({
                ...pdv,
                is_visited: visitedPdvs.some((visit: any) => visit.pdv_id === pdv.id)
            }));

            setPdvs(pdvsWithVisitStatus);

            // Cargar GPS tracking si hay datos de jornada laboral
            if (workingSession?.id) {
                await loadGpsTracking();
            }
        } catch (error) {
            console.error('Error cargando PDVs:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los PDVs de la ruta.',
                duration: 4000
            });
        } finally {
            setLoading(false);
        }
    };

        const loadGpsTracking = async () => {
        if (!workingSession?.id || !userId) {
            return;
        }

        try {
            // Convertir fecha de dd/mm/yyyy a yyyy-mm-dd
            const dateParts = visitDate.split('/');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

            const response = await axios.get(`/reportes/jornadas-laborales/gps-tracking`, {
                params: {
                    user_id: userId,
                    date: formattedDate,
                    working_session_id: workingSession.id
                }
            });

            const trackingData = response.data.tracking || [];

            // Filtrar puntos con coordenadas válidas
            const validTrackingPoints = trackingData.filter((point: GpsTrackingPoint) => {
                const lat = parseFloat(point.latitude.toString());
                const lng = parseFloat(point.longitude.toString());
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            setGpsTracking(validTrackingPoints);
        } catch (error) {
            console.error('Error cargando GPS tracking:', error);
            // No mostrar toast de error para GPS tracking, es opcional
        }
    };

    const initializeMap = () => {
        try {
            if (typeof window !== 'undefined' && window.L && mapContainer) {
                const L = window.L;

                const newMap = L.map(mapContainer).setView([-12.0464, -77.0428], 12);

                // Crear diferentes capas de mapas
                const mapLayers = {
                    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }),
                    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                        attribution: '© Esri'
                    }),
                    terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenTopoMap'
                    }),
                    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '© CartoDB'
                    })
                };

                // Agregar la capa por defecto
                mapLayers.streets.addTo(newMap);

                setMap(newMap);
                setMapLayers(mapLayers);

                setTimeout(() => {
                    if (newMap) {
                        newMap.invalidateSize();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error inicializando mapa:', error);
            setMapError('Error al inicializar el mapa');
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo inicializar el mapa.',
                duration: 4000
            });
        }
    };

    const updateMarkers = () => {
        if (!map || !window.L) return;

        const L = window.L;

        try {
            // Limpiar marcadores existentes
            markers.forEach(marker => map.removeLayer(marker));
            const newMarkers: any[] = [];

            // Agregar marcador de inicio de jornada laboral
            if (workingSession?.start_latitude && workingSession?.start_longitude) {
                const startLat = parseFloat(workingSession.start_latitude.toString());
                const startLng = parseFloat(workingSession.start_longitude.toString());

                if (!isNaN(startLat) && !isNaN(startLng) && startLat !== 0 && startLng !== 0) {
                    // Icono personalizado para inicio de jornada
                    const startIcon = L.divIcon({
                        className: 'start-marker',
                        html: `<div style="
                            width: 24px;
                            height: 24px;
                            background-color: #10b981;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 12px;
                            font-weight: bold;
                            transition: all 0.2s ease;
                            cursor: pointer;
                        " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.4)'">🚀</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    const startMarker = L.marker([startLat, startLng], { icon: startIcon })
                        .bindPopup(`
                            <div class="p-3">
                                <h3 class="font-semibold text-sm text-green-700">🚀 Inicio de Jornada</h3>
                                <p class="text-xs text-gray-600 mt-1">${new Date(workingSession.started_at).toLocaleString('es-ES')}</p>
                                <p class="text-xs text-gray-500 mt-1">Lat: ${startLat.toFixed(6)}</p>
                                <p class="text-xs text-gray-500">Lng: ${startLng.toFixed(6)}</p>
                            </div>
                        `)
                        .addTo(map);

                    newMarkers.push(startMarker);
                }
            }

            // Agregar marcador de fin de jornada laboral
            if (workingSession?.end_latitude && workingSession?.end_longitude && workingSession?.ended_at) {
                const endLat = parseFloat(workingSession.end_latitude.toString());
                const endLng = parseFloat(workingSession.end_longitude.toString());

                if (!isNaN(endLat) && !isNaN(endLng) && endLat !== 0 && endLng !== 0) {
                    // Icono personalizado para fin de jornada
                    const endIcon = L.divIcon({
                        className: 'end-marker',
                        html: `<div style="
                            width: 24px;
                            height: 24px;
                            background-color: #ef4444;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 12px;
                            font-weight: bold;
                            transition: all 0.2s ease;
                            cursor: pointer;
                        " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.4)'">🏁</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    const endMarker = L.marker([endLat, endLng], { icon: endIcon })
                        .bindPopup(`
                            <div class="p-3">
                                <h3 class="font-semibold text-sm text-red-700">🏁 Fin de Jornada</h3>
                                <p class="text-xs text-gray-600 mt-1">${new Date(workingSession.ended_at).toLocaleString('es-ES')}</p>
                                <p class="text-xs text-gray-500 mt-1">Lat: ${endLat.toFixed(6)}</p>
                                <p class="text-xs text-gray-500">Lng: ${endLng.toFixed(6)}</p>
                            </div>
                        `)
                        .addTo(map);

                    newMarkers.push(endMarker);
                }
            }

            // Filtrar PDVs con coordenadas válidas
            const pdvsWithCoords = pdvs.filter(pdv => {
                const lat = parseFloat(pdv.latitude.toString());
                const lng = parseFloat(pdv.longitude.toString());
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            // Agregar marcadores para cada PDV
            pdvsWithCoords.forEach((pdv, index) => {
                const lat = parseFloat(pdv.latitude.toString());
                const lng = parseFloat(pdv.longitude.toString());

                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`Coordenadas inválidas para PDV ${pdv.id}:`, pdv.latitude, pdv.longitude);
                    return;
                }

                // Color del marcador basado en si fue visitado
                const markerColor = pdv.is_visited ? '#22c55e' : '#3b82f6'; // Verde si visitado, azul si no
                const statusText = pdv.is_visited ? 'Visitado' : 'Pendiente';
                const statusClass = pdv.is_visited ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

                // Crear icono personalizado con el color correspondiente
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        width: 20px;
                        height: 20px;
                        background-color: ${markerColor};
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 10px;
                        font-weight: bold;
                        transition: all 0.2s ease;
                        cursor: pointer;
                    " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.3)'">${index + 1}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                const marker = L.marker([lat, lng], { icon: customIcon })
                    .bindPopup(`
                        <div class="p-2">
                            <h3 class="font-semibold text-sm">${pdv.point_name}</h3>
                            <p class="text-xs text-gray-600">${pdv.client_name}</p>
                            <p class="text-xs text-gray-500">${pdv.address}</p>
                            ${pdv.locality ? `<p class="text-xs text-gray-400">${pdv.locality}</p>` : ''}
                            <div class="mt-2">
                                <span class="inline-block px-2 py-1 text-xs rounded ${statusClass}">
                                    ${statusText}
                                </span>
                            </div>
                            <div class="mt-1 text-xs text-gray-600 font-medium">
                                Parada ${index + 1}
                            </div>
                        </div>
                    `)
                    .addTo(map);

                newMarkers.push(marker);
            });

            // Agregar línea de GPS tracking si hay datos
            if (gpsTracking.length > 1) {
                const trackingPoints = gpsTracking.map(point => [point.latitude, point.longitude]);

                // Crear línea de tracking con color y opacidad
                const trackingLine = L.polyline(trackingPoints, {
                    color: '#3b82f6', // Azul
                    weight: 5, // Aumentado de 3 a 5
                    opacity: 0.9, // Aumentado de 0.8 a 0.9
                    // Sin dashArray para línea continua
                }).addTo(map);

                newMarkers.push(trackingLine);

                // Agregar marcadores pequeños para puntos de tracking
                gpsTracking.forEach((point, index) => {
                    const lat = parseFloat(point.latitude.toString());
                    const lng = parseFloat(point.longitude.toString());

                    if (!isNaN(lat) && !isNaN(lng)) {
                        // Icono pequeño para puntos de tracking
                        const trackingIcon = L.divIcon({
                            className: 'tracking-point',
                            html: `<div style="
                                width: 8px;
                                height: 8px;
                                background-color: #3b82f6;
                                border: 2px solid white;
                                border-radius: 50%;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                            "></div>`,
                            iconSize: [8, 8],
                            iconAnchor: [4, 4]
                        });

                        const trackingMarker = L.marker([lat, lng], { icon: trackingIcon })
                            .bindPopup(`
                                <div class="p-2">
                                    <h3 class="font-semibold text-sm text-blue-700">📍 Punto de Tracking</h3>
                                    <p class="text-xs text-gray-600">${new Date(point.recorded_at).toLocaleString('es-ES')}</p>
                                    ${point.speed ? `<p class="text-xs text-gray-500">Velocidad: ${point.speed.toFixed(1)} km/h</p>` : ''}
                                    ${point.accuracy ? `<p class="text-xs text-gray-500">Precisión: ${point.accuracy.toFixed(1)}m</p>` : ''}
                                    ${point.battery_level ? `<p class="text-xs text-gray-500">Batería: ${point.battery_level}%</p>` : ''}
                                    ${point.is_mock_location ? `<p class="text-xs text-red-600 font-medium">⚠️ GPS simulado</p>` : ''}
                                </div>
                            `)
                            .addTo(map);

                        newMarkers.push(trackingMarker);
                    }
                });
            }

            setMarkers(newMarkers);

            // Ajustar vista si hay PDVs
            if (newMarkers.length > 0) {
                const group = L.featureGroup(newMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        } catch (error) {
            console.error('Error al actualizar marcadores:', error);
            setMarkers([]);
        }
    };

    const handleMapTypeChange = (mapType: string) => {
        if (!map || !mapLayers[mapType]) return;

        // Remover todas las capas
        Object.values(mapLayers).forEach((layer: any) => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });

        // Agregar la nueva capa
        mapLayers[mapType].addTo(map);
        setSelectedMapType(mapType);
    };

    const handleClose = () => {
        if (map) {
            map.remove();
            setMap(null);
        }
        setMarkers([]);
        setPdvs([]);
        setMapError(null);
        setMapLayers({});
        setSelectedMapType('streets');
        onClose();
    };

    const visitedCount = pdvs.filter(pdv => pdv.is_visited).length;
    const totalCount = pdvs.length;

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-[95vw] h-[90vh] sm:w-[99vw] sm:h-[95vh] translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200 overflow-hidden"
                >
                <DialogHeader className="p-2 sm:p-3 lg:p-6 pb-1 sm:pb-2 lg:pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                    PDVs de la Ruta: {route?.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs lg:text-sm text-gray-600 truncate">
                                    {route?.code} • Fecha: {visitDate} • {visitedCount}/{totalCount} visitados
                                </DialogDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex flex-col h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                    {/* Información de la ruta */}
                    <div className="px-2 sm:px-3 lg:px-6 pb-1 sm:pb-2 lg:pb-4 flex-shrink-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{totalCount} PDVs en la ruta</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                <span>PDVs de la ruta</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                <span>PDVs visitados</span>
                            </div>
                            {workingSession?.start_latitude && workingSession?.start_longitude && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
                                    <span>🚀 Inicio jornada</span>
                                </div>
                            )}
                            {workingSession?.end_latitude && workingSession?.end_longitude && workingSession?.ended_at && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                                    <span>🏁 Fin jornada</span>
                                </div>
                            )}
                            {gpsTracking.length > 0 && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                    <span>📍 GPS Tracking</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-4 p-2 sm:p-3 lg:p-6 pt-0 min-h-0">
                        {/* Mapa */}
                        <div className="flex-1 relative min-h-[380px] sm:min-h-[420px] lg:min-h-[400px] max-h-[420px] sm:max-h-[480px] lg:max-h-none">
                            {/* Selector de tipo de mapa */}
                            {map && Object.keys(mapLayers).length > 0 && (
                                <div className="absolute top-2 left-2 z-[1000] bg-white rounded-lg shadow-lg border p-2">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMapTypeChange('streets')}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                                selectedMapType === 'streets'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            🗺️ Calles
                                        </button>
                                        <button
                                            onClick={() => handleMapTypeChange('satellite')}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                                selectedMapType === 'satellite'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            🛰️ Satélite
                                        </button>
                                        <button
                                            onClick={() => handleMapTypeChange('terrain')}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                                selectedMapType === 'terrain'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            🏔️ Terreno
                                        </button>
                                        <button
                                            onClick={() => handleMapTypeChange('dark')}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                                selectedMapType === 'dark'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            🌙 Oscuro
                                        </button>
                                    </div>
                                </div>
                            )}
                            {loading ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Cargando PDVs...</p>
                                    </div>
                                </div>
                            ) : mapError ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">Error al cargar el mapa</p>
                                        <p className="text-xs text-gray-500 mt-1">{mapError}</p>
                                    </div>
                                </div>
                            ) : pdvs.filter(p => {
                                const lat = parseFloat(p.latitude.toString());
                                const lng = parseFloat(p.longitude.toString());
                                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                            }).length === 0 ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">No hay PDVs con coordenadas válidas</p>
                                        <p className="text-xs text-gray-500 mt-1">Los PDVs necesitan latitud y longitud para mostrarse en el mapa</p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    ref={setMapContainer}
                                    className="w-full h-full bg-gray-100 rounded-lg"
                                    style={{ minHeight: '380px', maxHeight: '100%' }}
                                />
                            )}
                        </div>

                        {/* Lista de PDVs */}
                        <div className="w-full lg:w-80 bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 flex flex-col min-h-[180px] sm:min-h-[220px] lg:min-h-[300px] mt-1">
                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 flex-shrink-0 text-sm sm:text-base">
                                <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                                PDVs de la Ruta
                            </h3>

                            <div className="flex-1 overflow-y-auto min-h-0">
                                {loading ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Card key={i} className="p-2 sm:p-3">
                                                <Skeleton className="h-3 sm:h-4 w-3/4 mb-1 sm:mb-2" />
                                                <Skeleton className="h-2 sm:h-3 w-1/2" />
                                            </Card>
                                        ))}
                                    </div>
                                ) : pdvs.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8">
                                        <Info className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xs sm:text-sm text-gray-600">No hay PDVs en esta ruta</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        {pdvs.map((pdv, index) => (
                                            <Card
                                                key={pdv.id}
                                                className="p-2 sm:p-3 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => {
                                                    if (map && pdv.latitude && pdv.longitude) {
                                                        map.setView([pdv.latitude, pdv.longitude], 16);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <div className={`w-4 h-4 sm:w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-medium ${
                                                                pdv.is_visited ? 'bg-green-600' : 'bg-blue-600'
                                                            }`}>
                                                                {index + 1}
                                                            </div>
                                                            <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                                                                {pdv.point_name}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {pdv.client_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            {pdv.address}
                                                        </p>
                                                        {pdv.locality && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {pdv.locality}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge className={`ml-1 sm:ml-2 flex-shrink-0 text-xs ${
                                                        pdv.is_visited
                                                            ? 'bg-green-100 text-green-800 border-green-200'
                                                            : 'bg-blue-100 text-blue-800 border-blue-200'
                                                    }`}>
                                                        {pdv.is_visited ? 'Visitado' : 'Pendiente'}
                                                    </Badge>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                </DialogPrimitive.Content>
            </DialogPortal>
                </Dialog>
    );
}
