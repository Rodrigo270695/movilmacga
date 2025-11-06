import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { MapPin, Navigation, X, Loader2, Info, CircuitBoard, Route as RouteIcon } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';

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
    route_id: number;
    route_name?: string;
    route_code?: string;
    circuit_id: number;
    circuit_name?: string;
    circuit_code?: string;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    routes: Array<{
        id: number;
        name: string;
        code: string;
    }>;
}

interface Zonal {
    id: number;
    name: string;
}

interface ZonalMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    zonal: Zonal | null;
}

// Colores para cada circuito (genera colores únicos)
const getCircuitColor = (circuitId: number, totalCircuits: number): string => {
    const colors = [
        '#3b82f6', // azul
        '#ef4444', // rojo
        '#10b981', // verde
        '#f59e0b', // amarillo
        '#8b5cf6', // púrpura
        '#ec4899', // rosa
        '#06b6d4', // cyan
        '#f97316', // naranja
        '#84cc16', // lima
        '#6366f1', // índigo
    ];
    
    const index = circuitId % colors.length;
    return colors[index] || '#6b7280'; // gris por defecto
};

export function ZonalMapModal({ isOpen, onClose, zonal }: ZonalMapModalProps) {
    const { addToast } = useToast();
    const [pdvs, setPdvs] = useState<Pdv[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);
    const [selectedCircuits, setSelectedCircuits] = useState<number[]>([]);
    const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
    const [stats, setStats] = useState<any>(null);

    // Rutas disponibles basadas en circuitos seleccionados
    const availableRoutes = useMemo(() => {
        if (selectedCircuits.length === 0) {
            return circuits.flatMap(c => c.routes);
        }
        return circuits
            .filter(c => selectedCircuits.includes(c.id))
            .flatMap(c => c.routes);
    }, [circuits, selectedCircuits]);

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen && zonal) {
            loadData();
        }
    }, [isOpen, zonal]);

    // Cargar PDVs cuando cambian los filtros
    useEffect(() => {
        if (isOpen && zonal) {
            loadPdvs();
        }
    }, [isOpen, zonal, selectedCircuits, selectedRoutes]);

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

    // Actualizar marcadores cuando cambian los PDVs o filtros
    useEffect(() => {
        if (map) {
            updateMarkers();
        }
    }, [pdvs, map, selectedCircuits, selectedRoutes, circuits]);

    // Forzar refresh del mapa cuando el modal se abre
    useEffect(() => {
        if (isOpen && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        }
    }, [isOpen, map]);

    const loadData = async () => {
        if (!zonal) return;

        setLoading(true);
        try {
            const response = await axios.get(route('dcs.zonales.pdvs', zonal.id));
            setCircuits(response.data.circuits || []);
            setPdvs(response.data.pdvs || []);
            setStats(response.data.stats || null);
        } catch (error) {
            console.error('Error cargando datos:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los datos del zonal.',
                duration: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPdvs = async () => {
        if (!zonal) return;

        // No poner loading = true aquí para no ocultar el mapa, solo actualizar los datos
        try {
            const params = new URLSearchParams();
            if (selectedCircuits.length > 0) {
                params.append('circuit_ids', selectedCircuits.join(','));
            }
            if (selectedRoutes.length > 0) {
                params.append('route_ids', selectedRoutes.join(','));
            }

            const url = route('dcs.zonales.pdvs', zonal.id) + (params.toString() ? `?${params.toString()}` : '');
            const response = await axios.get(url);
            setPdvs(response.data.pdvs || []);
            setStats(response.data.stats || null);
        } catch (error) {
            console.error('Error cargando PDVs:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los PDVs.',
                duration: 4000
            });
        }
    };

    const initializeMap = () => {
        try {
            if (typeof window !== 'undefined' && window.L && mapContainer) {
                const L = window.L;

                // Crear mapa
                const newMap = L.map(mapContainer).setView([-12.0464, -77.0428], 12); // Lima por defecto

                // Agregar capa de OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(newMap);

                setMap(newMap);

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
            markers.forEach(marker => {
                try {
                    map.removeLayer(marker);
                } catch (e) {
                    // Ignorar errores al remover marcadores
                }
            });
            const newMarkers: any[] = [];

            // Filtrar PDVs con coordenadas válidas
            const pdvsWithCoords = pdvs.filter(pdv => {
                const lat = Number(pdv.latitude);
                const lng = Number(pdv.longitude);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            // Obtener colores únicos por circuito
            const circuitColors = new Map<number, string>();
            const uniqueCircuitIds = [...new Set(pdvsWithCoords.map(p => p.circuit_id))];
            uniqueCircuitIds.forEach((circuitId, index) => {
                circuitColors.set(circuitId, getCircuitColor(circuitId, circuits.length));
            });

            // Agregar marcadores para cada PDV
            pdvsWithCoords.forEach((pdv, index) => {
                const lat = Number(pdv.latitude);
                const lng = Number(pdv.longitude);

                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`Coordenadas inválidas para PDV ${pdv.id}:`, pdv.latitude, pdv.longitude);
                    return;
                }

                const circuitColor = circuitColors.get(pdv.circuit_id) || '#6b7280';

                // Crear ícono de marcador con color del circuito
                const markerIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div style="
                            width: 20px;
                            height: 20px;
                            background-color: ${circuitColor};
                            border: 2px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        "></div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                const marker = L.marker([lat, lng], { icon: markerIcon })
                    .bindPopup(`
                        <div class="p-2">
                            <h3 class="font-semibold text-sm">${pdv.point_name}</h3>
                            <p class="text-xs text-gray-600">${pdv.client_name}</p>
                            <p class="text-xs text-gray-500">${pdv.address}</p>
                            ${pdv.locality ? `<p class="text-xs text-gray-400">${pdv.locality}</p>` : ''}
                            <div class="mt-2 space-y-1">
                                <div class="text-xs">
                                    <span class="font-medium">Circuito:</span> ${pdv.circuit_name || 'N/A'} (${pdv.circuit_code || 'N/A'})
                                </div>
                                <div class="text-xs">
                                    <span class="font-medium">Ruta:</span> ${pdv.route_name || 'N/A'} (${pdv.route_code || 'N/A'})
                                </div>
                                <span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                    Activo (Vende)
                                </span>
                            </div>
                        </div>
                    `)
                    .addTo(map);

                newMarkers.push(marker);
            });

            setMarkers(newMarkers);

            // Ajustar vista si hay PDVs, si no, mantener la vista actual
            if (newMarkers.length > 0) {
                const group = L.featureGroup(newMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
            // Si no hay marcadores, mantener el mapa visible con la vista actual
        } catch (error) {
            console.error('Error al actualizar marcadores:', error);
            setMarkers([]);
        }
    };

    const handleCircuitToggle = (circuitId: number) => {
        setSelectedCircuits(prev => {
            if (prev.includes(circuitId)) {
                // Deseleccionar circuito y limpiar rutas seleccionadas de ese circuito
                const circuit = circuits.find(c => c.id === circuitId);
                const circuitRouteIds = circuit?.routes.map(r => r.id) || [];
                setSelectedRoutes(prevRoutes => prevRoutes.filter(id => !circuitRouteIds.includes(id)));
                return prev.filter(id => id !== circuitId);
            } else {
                return [...prev, circuitId];
            }
        });
    };

    const handleSelectAllCircuits = () => {
        if (selectedCircuits.length === circuits.length) {
            setSelectedCircuits([]);
            setSelectedRoutes([]);
        } else {
            setSelectedCircuits(circuits.map(c => c.id));
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
        setCircuits([]);
        setSelectedCircuits([]);
        setSelectedRoutes([]);
        setStats(null);
        setMapError(null);
        onClose();
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
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                    Mapa de Zonal: {zonal?.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs lg:text-sm text-gray-600 truncate">
                                    PDVs activos del zonal • Filtros por circuitos y rutas
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
                    {/* Filtros */}
                    <div className="px-2 sm:px-3 lg:px-6 pb-2 sm:pb-3 lg:pb-4 flex-shrink-0 border-b border-gray-200 bg-gray-50">
                        <div className="space-y-3">
                            {/* Filtro de circuitos */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <CircuitBoard className="w-4 h-4" />
                                        Circuitos ({selectedCircuits.length}/{circuits.length})
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSelectAllCircuits}
                                        className="text-xs h-6 px-2"
                                    >
                                        {selectedCircuits.length === circuits.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {circuits.map((circuit) => {
                                        const isSelected = selectedCircuits.includes(circuit.id);
                                        const circuitColor = getCircuitColor(circuit.id, circuits.length);
                                        return (
                                            <div
                                                key={circuit.id}
                                                className="flex items-center space-x-2 cursor-pointer"
                                                onClick={() => handleCircuitToggle(circuit.id)}
                                            >
                                                <Checkbox
                                                    id={`circuit-${circuit.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleCircuitToggle(circuit.id)}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-blue-300"
                                                />
                                                <label
                                                    htmlFor={`circuit-${circuit.id}`}
                                                    className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full border border-white"
                                                        style={{ backgroundColor: circuitColor }}
                                                    />
                                                    {circuit.name} ({circuit.code})
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Filtro de rutas */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <RouteIcon className="w-4 h-4" />
                                        Rutas ({selectedRoutes.length}/{availableRoutes.length})
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedRoutes.length === availableRoutes.length) {
                                                setSelectedRoutes([]);
                                            } else {
                                                setSelectedRoutes(availableRoutes.map(r => r.id));
                                            }
                                        }}
                                        className="text-xs h-6 px-2"
                                    >
                                        {selectedRoutes.length === availableRoutes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {availableRoutes.length === 0 ? (
                                        <p className="text-xs text-gray-500">
                                            Selecciona circuitos para ver sus rutas
                                        </p>
                                    ) : (
                                        availableRoutes.map((route) => {
                                            const isSelected = selectedRoutes.includes(route.id);
                                            const circuit = circuits.find(c => c.routes.some(r => r.id === route.id));
                                            const circuitColor = circuit ? getCircuitColor(circuit.id, circuits.length) : '#6b7280';
                                            return (
                                                <div
                                                    key={route.id}
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedRoutes(prev => {
                                                            if (prev.includes(route.id)) {
                                                                return prev.filter(id => id !== route.id);
                                                            } else {
                                                                return [...prev, route.id];
                                                            }
                                                        });
                                                    }}
                                                >
                                                    <Checkbox
                                                        id={`route-${route.id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={() => {
                                                            setSelectedRoutes(prev => {
                                                                if (prev.includes(route.id)) {
                                                                    return prev.filter(id => id !== route.id);
                                                                } else {
                                                                    return [...prev, route.id];
                                                                }
                                                            });
                                                        }}
                                                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-emerald-300"
                                                    />
                                                    <label
                                                        htmlFor={`route-${route.id}`}
                                                        className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full border border-white"
                                                            style={{ backgroundColor: circuitColor }}
                                                        />
                                                        {route.name} ({route.code})
                                                    </label>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Estadísticas */}
                            {stats && (
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 pt-2 border-t">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>{stats.total} PDVs activos</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                        <span>{stats.with_coordinates} con coordenadas</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-4 p-2 sm:p-3 lg:p-6 pt-3 sm:pt-4 min-h-0">
                        {/* Mapa */}
                        <div className="flex-1 relative min-h-[380px] sm:min-h-[420px] lg:min-h-[400px] max-h-[420px] sm:max-h-[480px] lg:max-h-none">
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
                                const lat = Number(p.latitude);
                                const lng = Number(p.longitude);
                                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                            }).length === 0 ? (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">No hay PDVs activos con coordenadas válidas</p>
                                        <p className="text-xs text-gray-500 mt-1">Ajusta los filtros o verifica que los PDVs tengan coordenadas</p>
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
                        <div className="w-full lg:w-80 bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 flex flex-col min-h-[180px] sm:min-h-[220px] lg:min-h-[300px]">
                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 flex-shrink-0 text-sm sm:text-base">
                                <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                                PDVs Activos ({pdvs.length})
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
                                        <p className="text-xs sm:text-sm text-gray-600">No hay PDVs activos</p>
                                        <p className="text-xs text-gray-500 mt-1">Ajusta los filtros para ver más resultados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        {pdvs.map((pdv) => {
                                            const circuitColor = getCircuitColor(pdv.circuit_id, circuits.length);
                                            return (
                                                <Card
                                                    key={pdv.id}
                                                    className="p-2 sm:p-3 hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => {
                                                        if (map && pdv.latitude && pdv.longitude) {
                                                            map.setView([Number(pdv.latitude), Number(pdv.longitude)], 16);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                                                <div
                                                                    className="w-3 h-3 rounded-full border border-white flex-shrink-0"
                                                                    style={{ backgroundColor: circuitColor }}
                                                                />
                                                                <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                                                                    {pdv.point_name}
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-gray-600">
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
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {pdv.circuit_name} ({pdv.circuit_code})
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {pdv.route_name} ({pdv.route_code})
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <Badge className="ml-1 sm:ml-2 flex-shrink-0 text-xs bg-green-100 text-green-800 border-green-200">
                                                            Activo
                                                        </Badge>
                                                    </div>
                                                </Card>
                                            );
                                        })}
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
