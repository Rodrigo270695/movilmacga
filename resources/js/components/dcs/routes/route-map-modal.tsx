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
}

interface RouteModel {
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
}

interface RouteMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: RouteModel | null;
}

export function RouteMapModal({ isOpen, onClose, route }: RouteMapModalProps) {
    const { addToast } = useToast();
    const [pdvs, setPdvs] = useState<Pdv[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);

    // Cargar PDVs cuando se abre el modal
    useEffect(() => {
        if (isOpen && route) {
            loadPdvs();
        }
    }, [isOpen, route]);

    // Inicializar mapa cuando se cargan los PDVs
    useEffect(() => {
        if (pdvs.length > 0 && mapContainer && !map) {
            // Verificar si Leaflet está disponible
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

    // Actualizar marcadores cuando cambian los PDVs
    useEffect(() => {
        if (map && pdvs.length > 0) {
            updateMarkers();
        }
    }, [pdvs, map]);

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
            const response = await axios.get(`/dcs/routes/${route.id}/pdvs`);
            setPdvs(response.data.pdvs || []);
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

    const initializeMap = () => {
        try {
            // Verificar si Leaflet está disponible
            if (typeof window !== 'undefined' && window.L && mapContainer) {
                const L = window.L;

                // Crear mapa
                const newMap = L.map(mapContainer).setView([-12.0464, -77.0428], 12); // Lima por defecto

                // Agregar capa de OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(newMap);

                setMap(newMap);

                // Forzar un refresh del mapa después de un pequeño delay
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

        // Limpiar marcadores y líneas existentes
        markers.forEach(marker => map.removeLayer(marker));
        const newMarkers: any[] = [];
        const routeLines: any[] = [];

        // Filtrar PDVs con coordenadas válidas
        const pdvsWithCoords = pdvs.filter(pdv => {
            const lat = parseFloat(pdv.latitude);
            const lng = parseFloat(pdv.longitude);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });

        // Agregar marcadores para cada PDV
        pdvsWithCoords.forEach((pdv, index) => {
            const lat = parseFloat(pdv.latitude);
            const lng = parseFloat(pdv.longitude);

            // Validación adicional antes de crear el marcador
            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Coordenadas inválidas para PDV ${pdv.id}:`, pdv.latitude, pdv.longitude);
                return;
            }

            const marker = L.marker([lat, lng])
                .bindPopup(`
                    <div class="p-2">
                        <h3 class="font-semibold text-sm">${pdv.point_name}</h3>
                        <p class="text-xs text-gray-600">${pdv.client_name}</p>
                        <p class="text-xs text-gray-500">${pdv.address}</p>
                        ${pdv.locality ? `<p class="text-xs text-gray-400">${pdv.locality}</p>` : ''}
                        <div class="mt-2">
                            <span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                Activo (Vende)
                            </span>
                        </div>
                        <div class="mt-1 text-xs text-blue-600 font-medium">
                            Parada ${index + 1}
                        </div>
                    </div>
                `)
                .addTo(map);

            newMarkers.push(marker);
        });

                // Dibujar líneas de la ruta si hay más de un PDV
        if (pdvsWithCoords.length > 1) {
            const routeCoordinates = pdvsWithCoords.map(pdv => {
                const lat = parseFloat(pdv.latitude);
                const lng = parseFloat(pdv.longitude);
                return [lat, lng];
            }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

            // Solo crear la línea si hay coordenadas válidas
            if (routeCoordinates.length > 1) {
                // Línea principal de la ruta
                const routeLine = L.polyline(routeCoordinates, {
                color: '#3b82f6', // Azul
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(map);

            routeLines.push(routeLine);

                        // Agregar flechas de dirección
            pdvsWithCoords.forEach((pdv, index) => {
                if (index < pdvsWithCoords.length - 1) {
                    const current = pdvsWithCoords[index];
                    const next = pdvsWithCoords[index + 1];

                    // Validar coordenadas antes de calcular
                    const currentLat = parseFloat(current.latitude);
                    const currentLng = parseFloat(current.longitude);
                    const nextLat = parseFloat(next.latitude);
                    const nextLng = parseFloat(next.longitude);

                    if (isNaN(currentLat) || isNaN(currentLng) || isNaN(nextLat) || isNaN(nextLng)) {
                        return; // Saltar esta flecha si las coordenadas son inválidas
                    }

                    // Calcular punto medio entre dos PDVs
                    const midLat = (currentLat + nextLat) / 2;
                    const midLng = (currentLng + nextLng) / 2;

                    // Calcular ángulo de rotación
                    const angle = Math.atan2(nextLat - currentLat, nextLng - currentLng) * 180 / Math.PI;

                    // Crear ícono de flecha
                    const arrowIcon = L.divIcon({
                        className: 'route-arrow',
                        html: `
                            <div style="
                                width: 0;
                                height: 0;
                                border-left: 8px solid #3b82f6;
                                border-top: 6px solid transparent;
                                border-bottom: 6px solid transparent;
                                transform: rotate(${angle}deg);
                            "></div>
                        `,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    const arrow = L.marker([midLat, midLng], { icon: arrowIcon }).addTo(map);
                    routeLines.push(arrow);
                }
            });
            }
        }

        setMarkers([...newMarkers, ...routeLines]);

        // Ajustar vista si hay PDVs
        if (newMarkers.length > 0) {
            const group = L.featureGroup(newMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
        } catch (error) {
            console.error('Error al actualizar marcadores:', error);
            // Limpiar marcadores en caso de error
            setMarkers([]);
        }
    };

    const handleClose = () => {
        // Limpiar mapa
        if (map) {
            map.remove();
            setMap(null);
        }
        setMarkers([]);
        setPdvs([]);
        setMapError(null);
        onClose();
    };

    const getStatusColor = (status: string) => {
        return status === 'vende' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

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
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                    Mapa de Ruta: {route?.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs lg:text-sm text-gray-600 truncate">
                                    {route?.circuit?.name} • {route?.code} • Solo PDVs activos
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
                                <span>{pdvs.length} PDVs activos</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                <span>Estado: Vende</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                <span>Mostrando solo PDVs activos</span>
                            </div>
                        </div>

                        {/* Leyenda de la ruta */}
                        {pdvs.filter(p => p.latitude && p.longitude).length > 1 && (
                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-3 sm:w-4 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
                                    <span>Ruta</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-blue-500 transform rotate-45"></div>
                                    <span>Dirección</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-600 rounded-full"></div>
                                    <span>Parada</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-4 p-2 sm:p-3 lg:p-6 pt-0 min-h-0">
                        {/* Mapa */}
                        <div className="flex-1 relative min-h-[380px] sm:min-h-[420px] lg:min-h-[400px] max-h-[420px] sm:max-h-[480px] lg:max-h-none">
                            {loading ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
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
                                const lat = parseFloat(p.latitude);
                                const lng = parseFloat(p.longitude);
                                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                            }).length === 0 ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">No hay PDVs activos con coordenadas válidas</p>
                                        <p className="text-xs text-gray-500 mt-1">Los PDVs activos necesitan latitud y longitud para mostrarse en el mapa</p>
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
                                PDVs Activos de la Ruta
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
                                    <p className="text-xs sm:text-sm text-gray-600">No hay PDVs activos en esta ruta</p>
                                    <p className="text-xs text-gray-500 mt-1">Solo se muestran PDVs con estado "vende"</p>
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
                                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
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
                                                <Badge className="ml-1 sm:ml-2 flex-shrink-0 text-xs bg-green-100 text-green-800 border-green-200">
                                                    Activo
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
