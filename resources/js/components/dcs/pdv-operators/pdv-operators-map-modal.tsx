import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogPortal,
    DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { MapPin, X, Loader2, Navigation, Info, Users } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';

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

interface PdvOperatorsMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    mapFilters: {
        search?: string;
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
        route_id?: string;
    };
}

export function PdvOperatorsMapModal({ isOpen, onClose, mapFilters }: PdvOperatorsMapModalProps) {
    const { addToast } = useToast();
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
        if (isOpen) loadMapData();
    }, [isOpen, params.search, params.business_id, params.zonal_id, params.circuit_id, params.route_id]);

    useEffect(() => {
        if (isOpen && mapContainer && !map && typeof window !== 'undefined' && (window as any).L) {
            initMap();
        }
    }, [isOpen, mapContainer, map]);

    useEffect(() => {
        if (map) updateMarkers();
    }, [map, pdvs, selectedOperatorIds]);

    useEffect(() => {
        if (isOpen && map) setTimeout(() => map.invalidateSize(), 200);
    }, [isOpen, map]);

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
        if (map) {
            map.remove();
            setMap(null);
        }
        setMarkers([]);
        setPdvs([]);
        setOperators([]);
        setSelectedOperatorIds([]);
        onClose();
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

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-[95vw] h-[90vh] sm:w-[96vw] sm:h-[92vh] lg:max-w-[1400px] lg:max-h-[90vh] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-gray-200 shadow-2xl duration-200 overflow-hidden flex flex-col"
                >
                    <DialogHeader className="p-3 sm:p-4 lg:p-5 pb-2 flex-shrink-0 border-b bg-white">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                                        Mapa PDV - Operadores
                                    </DialogTitle>
                                    <DialogDescription className="text-xs lg:text-sm text-gray-600 truncate">
                                        Solo operadores en Sí • Filtro por operador (varios). {filteredPdvs.length} PDVs con coordenadas.
                                    </DialogDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0 rounded-lg"
                                aria-label="Cerrar modal"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                        {/* Filtro por operador - texto + color, multi-select (estilo zonal) */}
                        <div className="px-3 sm:px-4 lg:px-6 py-3 flex-shrink-0 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Operadores ({selectedOperatorIds.length}/{operators.length})
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAllOperators}
                                    className="text-xs h-7 px-2"
                                >
                                    {selectedOperatorIds.length === operators.length
                                        ? 'Deseleccionar todos'
                                        : 'Seleccionar todos'}
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-28 overflow-y-auto">
                                {operators.map((op) => {
                                    const opColor =
                                        op.color && /^#[0-9A-Fa-f]{6}$/.test(op.color) ? op.color : '#6366f1';
                                    return (
                                        <div
                                            key={op.id}
                                            className="flex items-center space-x-2 cursor-pointer"
                                            onClick={() => toggleOperator(op.id)}
                                        >
                                            <Checkbox
                                                id={`operator-map-${op.id}`}
                                                checked={selectedOperatorIds.includes(op.id)}
                                                onCheckedChange={() => toggleOperator(op.id)}
                                                className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 border-pink-300"
                                            />
                                            <label
                                                htmlFor={`operator-map-${op.id}`}
                                                className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full border border-white shadow flex-shrink-0"
                                                    style={{ backgroundColor: opColor }}
                                                />
                                                {op.name}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 pt-2 mt-2 border-t border-gray-200">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {filteredPdvs.length} PDVs en mapa
                                </span>
                                <span className="text-gray-400">Vacío = todos los operadores en Sí</span>
                            </div>
                        </div>

                        {/* Contenido: mapa + lista (responsive como zonal) */}
                        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 min-h-0">
                            {/* Mapa */}
                            <div className="flex-1 relative min-h-[280px] sm:min-h-[320px] lg:min-h-[380px] max-h-[50vh] sm:max-h-[420px] lg:max-h-none rounded-lg overflow-hidden bg-gray-100">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                        <div className="text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Cargando datos...</p>
                                        </div>
                                    </div>
                                ) : !(typeof window !== 'undefined' && (window as any).L) ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                        <p className="text-sm text-gray-600">Mapa no disponible</p>
                                    </div>
                                ) : filteredPdvs.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                        <div className="text-center px-4">
                                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600">No hay PDVs con coordenadas para los filtros</p>
                                            <p className="text-xs text-gray-500 mt-1">Ajusta operadores o verifica que los PDVs tengan coordenadas</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div ref={setMapContainer} className="w-full h-full" />
                                )}
                            </div>

                            {/* Lista de PDVs (desktop derecha; móvil abajo) */}
                            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-[200px] sm:min-h-[240px] lg:min-h-[300px]">
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm sm:text-base flex-shrink-0">
                                    <Navigation className="w-4 h-4" />
                                    PDVs en mapa ({filteredPdvs.length})
                                </h3>
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    {loading ? (
                                        <div className="space-y-2">
                                            {[...Array(4)].map((_, i) => (
                                                <Card key={i} className="p-2 sm:p-3">
                                                    <Skeleton className="h-3 w-3/4 mb-1" />
                                                    <Skeleton className="h-2 w-1/2" />
                                                </Card>
                                            ))}
                                        </div>
                                    ) : filteredPdvs.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs sm:text-sm text-gray-600">No hay PDVs que coincidan</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredPdvs.map((pdv) => {
                                                const opsSi = getOperatorsSi(pdv);
                                                return (
                                                    <Card
                                                        key={pdv.id}
                                                        className="p-2 sm:p-3 hover:shadow-md transition-shadow cursor-pointer"
                                                        onClick={() => {
                                                            if (map && pdv.latitude && pdv.longitude) {
                                                                map.setView(
                                                                    [Number(pdv.latitude), Number(pdv.longitude)],
                                                                    16
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                                                                    {pdv.point_name}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 truncate">
                                                                    {pdv.client_name}
                                                                </p>
                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                    {opsSi.slice(0, 4).map((op) => (
                                                                        <span
                                                                            key={op.id}
                                                                            className="w-2 h-2 rounded-full border border-white shadow"
                                                                            style={{ backgroundColor: op.color }}
                                                                            title={operators.find((o) => o.id === op.id)?.name}
                                                                        />
                                                                    ))}
                                                                    {opsSi.length > 4 && (
                                                                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
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
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
