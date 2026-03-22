import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { MapPin, X, Loader2, Navigation, Info, Users } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';

interface MapPdv {
    id: number;
    point_name: string;
    client_name: string;
    latitude: number;
    longitude: number;
    operators?: { id: number; name: string; color?: string | null; pivot?: { status: boolean } }[];
}

interface MapOperator {
    id: number;
    name: string;
    color?: string | null;
}

export interface PdvOperatorsMapFilters {
    search?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    route_id?: string;
}

export interface PdvOperatorsMapViewProps {
    mapFilters: PdvOperatorsMapFilters;
    /** Cuando es false no se cargan datos y se destruye el mapa (p. ej. modal cerrado). */
    enabled?: boolean;
    onClose?: () => void;
    className?: string;
    /** Vista embebida en página (sin altura tipo modal a pantalla completa). */
    embedded?: boolean;
}

export function PdvOperatorsMapView({
    mapFilters,
    enabled = true,
    onClose,
    className,
    embedded = false,
}: PdvOperatorsMapViewProps) {
    const { addToast } = useToast();
    const mapRef = useRef<any>(null);
    const [pdvs, setPdvs] = useState<MapPdv[]>([]);
    const [operators, setOperators] = useState<MapOperator[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [selectedOperatorIds, setSelectedOperatorIds] = useState<number[]>([]);

    const params = useMemo(() => {
        const p: Record<string, string> = {};
        if (mapFilters.search) p.search = mapFilters.search;
        if (mapFilters.business_id) p.business_id = mapFilters.business_id;
        if (mapFilters.zonal_id) p.zonal_id = mapFilters.zonal_id;
        if (mapFilters.circuit_id) p.circuit_id = mapFilters.circuit_id;
        if (mapFilters.route_id) p.route_id = mapFilters.route_id;
        return p;
    }, [mapFilters]);

    useEffect(() => {
        if (!enabled) {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setMap(null);
            setMarkers([]);
            setPdvs([]);
            setOperators([]);
            setSelectedOperatorIds([]);
            return;
        }
        loadMapData();
    }, [enabled, params.search, params.business_id, params.zonal_id, params.circuit_id, params.route_id]);

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (enabled && mapContainer && !map && typeof window !== 'undefined' && (window as any).L) {
            initMap();
        }
    }, [enabled, mapContainer, map]);

    useEffect(() => {
        if (map) updateMarkers();
    }, [map, pdvs, selectedOperatorIds]);

    useEffect(() => {
        if (enabled && map) setTimeout(() => map.invalidateSize(), 200);
    }, [enabled, map]);

    const loadMapData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('dcs.pdv-operators.map-data'), { params });
            setPdvs(data.pdvs || []);
            setOperators(data.operators || []);
        } catch (e) {
            console.error(e);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los datos del mapa.',
                duration: 4000,
            });
            setPdvs([]);
            setOperators([]);
        } finally {
            setLoading(false);
        }
    };

    const initMap = () => {
        const L = (window as any).L;
        if (!L || !mapContainer) return;
        const newMap = L.map(mapContainer).setView([-12.0464, -77.0428], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(newMap);
        mapRef.current = newMap;
        setMap(newMap);
        setTimeout(() => newMap.invalidateSize(), 100);
    };

    const getOperatorsSi = (pdv: MapPdv): { id: number; color: string }[] => {
        const list: { id: number; color: string }[] = [];
        (pdv.operators || []).forEach((op) => {
            if (op.pivot?.status) {
                const color = op.color && /^#[0-9A-Fa-f]{6}$/.test(op.color) ? op.color : '#6366f1';
                list.push({ id: op.id, color });
            }
        });
        return list;
    };

    const updateMarkers = () => {
        const L = (window as any).L;
        if (!L || !map) return;

        markers.forEach((m) => map.removeLayer(m));
        const newMarkers: any[] = [];

        const pdvsWithCoords = pdvs.filter((p) => {
            const lat = Number(p.latitude);
            const lng = Number(p.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
            const operatorsSi = getOperatorsSi(p);
            if (selectedOperatorIds.length === 0) return operatorsSi.length > 0;
            return operatorsSi.some((op) => selectedOperatorIds.includes(op.id));
        });

        pdvsWithCoords.forEach((pdv) => {
            const lat = Number(pdv.latitude);
            const lng = Number(pdv.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            let operatorsSi = getOperatorsSi(pdv);
            if (selectedOperatorIds.length > 0) {
                operatorsSi = operatorsSi.filter((op) => selectedOperatorIds.includes(op.id));
            }
            if (operatorsSi.length === 0) return;

            const dotsHtml = operatorsSi
                .map(
                    (op) =>
                        `<span class="block w-2.5 h-2.5 rounded-full border border-white shadow flex-shrink-0" style="background-color:${op.color}"></span>`
                )
                .join('');

            const icon = L.divIcon({
                className: 'pdv-operator-marker',
                html: `
                    <div class="flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full bg-pink-500 border-2 border-white shadow flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <div class="flex items-center gap-0.5 mt-0.5 bg-white/90 rounded px-1 py-0.5 shadow">${dotsHtml}</div>
                    </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24],
            });

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(
                    `<div class="p-2 min-w-[140px]"><p class="font-semibold text-sm">${pdv.point_name}</p><p class="text-xs text-gray-600">${pdv.client_name}</p></div>`
                )
                .addTo(map);
            newMarkers.push(marker);
        });

        setMarkers(newMarkers);
        if (newMarkers.length > 0) {
            const group = L.featureGroup(newMarkers);
            map.fitBounds(group.getBounds().pad(0.08));
        }
    };

    const handleClose = () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        setMap(null);
        setMarkers([]);
        setPdvs([]);
        setOperators([]);
        setSelectedOperatorIds([]);
        onClose?.();
    };

    const toggleOperator = (id: number) => {
        setSelectedOperatorIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSelectAllOperators = () => {
        if (selectedOperatorIds.length === operators.length) {
            setSelectedOperatorIds([]);
        } else {
            setSelectedOperatorIds(operators.map((o) => o.id));
        }
    };

    const filteredPdvs = useMemo(() => {
        return pdvs.filter((p) => {
            const lat = Number(p.latitude);
            const lng = Number(p.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
            const operatorsSi = getOperatorsSi(p);
            if (selectedOperatorIds.length === 0) return operatorsSi.length > 0;
            return operatorsSi.some((op) => selectedOperatorIds.includes(op.id));
        });
    }, [pdvs, selectedOperatorIds]);

    if (!enabled) {
        return null;
    }

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden bg-background', className)}>
            <div className="flex-shrink-0 border-b bg-white p-3 sm:p-4 lg:p-5 pb-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 lg:gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-pink-100 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                            <MapPin className="h-4 w-4 text-pink-600 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold sm:text-lg lg:text-xl">Mapa PDV - Operadores</h2>
                            <p className="truncate text-xs text-gray-600 lg:text-sm">
                                Solo operadores en Sí • Filtro por operador (varios). {filteredPdvs.length} PDVs con
                                coordenadas.
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-8 w-8 flex-shrink-0 rounded-lg p-0 sm:h-9 sm:w-9"
                            aria-label="Cerrar mapa"
                            type="button"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    )}
                </div>
            </div>

            <div
                className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', embedded && 'min-h-[50vh]')}
                style={embedded ? undefined : { maxHeight: 'calc(90vh - 80px)' }}
            >
                <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4 lg:px-6">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 sm:text-sm">
                            <Users className="h-4 w-4" />
                            Operadores ({selectedOperatorIds.length}/{operators.length})
                        </label>
                        <Button variant="ghost" size="sm" onClick={handleSelectAllOperators} className="h-7 px-2 text-xs">
                            {selectedOperatorIds.length === operators.length
                                ? 'Deseleccionar todos'
                                : 'Seleccionar todos'}
                        </Button>
                    </div>
                    <div className="flex max-h-28 flex-wrap gap-x-4 gap-y-2 overflow-y-auto">
                        {operators.map((op) => {
                            const opColor =
                                op.color && /^#[0-9A-Fa-f]{6}$/.test(op.color) ? op.color : '#6366f1';
                            return (
                                <div
                                    key={op.id}
                                    className="flex cursor-pointer items-center space-x-2"
                                    onClick={() => toggleOperator(op.id)}
                                >
                                    <Checkbox
                                        id={`operator-map-${op.id}`}
                                        checked={selectedOperatorIds.includes(op.id)}
                                        onCheckedChange={() => toggleOperator(op.id)}
                                        className="border-pink-300 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
                                    />
                                    <label
                                        htmlFor={`operator-map-${op.id}`}
                                        className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-700 sm:text-sm"
                                    >
                                        <span
                                            className="h-3 w-3 flex-shrink-0 rounded-full border border-white shadow"
                                            style={{ backgroundColor: opColor }}
                                        />
                                        {op.name}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-2 text-xs text-gray-600 sm:gap-4">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {filteredPdvs.length} PDVs en mapa
                        </span>
                        <span className="text-gray-400">Vacío = todos los operadores en Sí</span>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:p-6">
                    <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-lg bg-gray-100 sm:min-h-[320px] sm:max-h-[420px] lg:max-h-none lg:min-h-[380px]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-pink-600" />
                                    <p className="text-sm text-gray-600">Cargando datos...</p>
                                </div>
                            </div>
                        ) : !(typeof window !== 'undefined' && (window as any).L) ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <p className="text-sm text-gray-600">Mapa no disponible</p>
                            </div>
                        ) : filteredPdvs.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="px-4 text-center">
                                    <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                    <p className="text-sm text-gray-600">No hay PDVs con coordenadas para los filtros</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Ajusta operadores o verifica que los PDVs tengan coordenadas
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div ref={setMapContainer} className="h-full w-full min-h-[280px] lg:min-h-[380px]" />
                        )}
                    </div>

                    <div className="flex min-h-[200px] w-full flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3 sm:min-h-[240px] lg:min-h-[300px] lg:w-72 xl:w-80">
                        <h3 className="mb-2 flex flex-shrink-0 items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                            <Navigation className="h-4 w-4" />
                            PDVs en mapa ({filteredPdvs.length})
                        </h3>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(4)].map((_, i) => (
                                        <Card key={i} className="p-2 sm:p-3">
                                            <Skeleton className="mb-1 h-3 w-3/4" />
                                            <Skeleton className="h-2 w-1/2" />
                                        </Card>
                                    ))}
                                </div>
                            ) : filteredPdvs.length === 0 ? (
                                <div className="py-6 text-center">
                                    <Info className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-xs text-gray-600 sm:text-sm">No hay PDVs que coincidan</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredPdvs.map((pdv) => {
                                        const opsSi = getOperatorsSi(pdv);
                                        return (
                                            <Card
                                                key={pdv.id}
                                                className="cursor-pointer p-2 transition-shadow hover:shadow-md sm:p-3"
                                                onClick={() => {
                                                    if (map && pdv.latitude && pdv.longitude) {
                                                        map.setView([Number(pdv.latitude), Number(pdv.longitude)], 16);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                                                            {pdv.point_name}
                                                        </h4>
                                                        <p className="truncate text-xs text-gray-600">{pdv.client_name}</p>
                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                            {opsSi.slice(0, 4).map((op) => (
                                                                <span
                                                                    key={op.id}
                                                                    className="h-2 w-2 rounded-full border border-white shadow"
                                                                    style={{ backgroundColor: op.color }}
                                                                    title={operators.find((o) => o.id === op.id)?.name}
                                                                />
                                                            ))}
                                                            {opsSi.length > 4 && (
                                                                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                                                                    +{opsSi.length - 4}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
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
        </div>
    );
}
