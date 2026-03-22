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
import type { PdvOperatorsMapFilters } from '@/components/dcs/pdv-operators/pdv-operators-map-view';

export type TipoNegocioMapFilters = PdvOperatorsMapFilters & {
    /** Valor enum de pdv_business_types.business_type (ej. Telco, Bodega). */
    business_type?: string;
};

interface BtOperatorRow {
    operator_id: number;
    name: string;
    color?: string | null;
    sale_mode: 'prepago' | 'pospago';
    business_type: string;
}

interface MapPdvBt {
    id: number;
    point_name: string;
    client_name: string;
    latitude: number;
    longitude: number;
    /** Para perímetros por zonal (viene del circuito de la ruta del PDV). */
    zonal_id?: number | null;
    zonal_name?: string | null;
    bt_operators: BtOperatorRow[];
}

interface MapOperator {
    id: number;
    name: string;
    color?: string | null;
}

export interface TipoNegocioMapViewProps {
    mapFilters: TipoNegocioMapFilters;
    enabled?: boolean;
    onClose?: () => void;
    className?: string;
    embedded?: boolean;
}

function operatorDotColor(color?: string | null): string {
    return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#6366f1';
}

/** Un punto por operador (color) según filas que cumplan modalidad y operador seleccionados. */
function getActiveOperatorDots(
    pdv: MapPdvBt,
    saleModes: { prepago: boolean; pospago: boolean },
    operatorIds: number[]
): { id: number; color: string }[] {
    const seen = new Set<number>();
    const list: { id: number; color: string }[] = [];
    for (const row of pdv.bt_operators ?? []) {
        if (!saleModes[row.sale_mode]) continue;
        if (operatorIds.length > 0 && !operatorIds.includes(row.operator_id)) continue;
        if (seen.has(row.operator_id)) continue;
        seen.add(row.operator_id);
        list.push({ id: row.operator_id, color: operatorDotColor(row.color) });
    }
    return list;
}

function filterBtRows(
    rows: BtOperatorRow[],
    saleModes: { prepago: boolean; pospago: boolean },
    operatorIds: number[]
): BtOperatorRow[] {
    return rows.filter((row) => {
        if (!saleModes[row.sale_mode]) return false;
        if (operatorIds.length > 0 && !operatorIds.includes(row.operator_id)) return false;
        return true;
    });
}

function saleModeLabel(m: BtOperatorRow['sale_mode']): string {
    return m === 'prepago' ? 'Prep.' : 'Posp.';
}

/** Envolvente convexa (monotone chain). Entrada/salida [lng, lat] para aproximar plano local. */
function convexHullLngLat(points: [number, number][]): [number, number][] {
    const n = points.length;
    if (n <= 1) return points.slice();
    const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
        (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }
    const upper: [number, number][] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

function uniqueLngLat(points: [number, number][]): [number, number][] {
    return Array.from(new Map(points.map((p) => [`${p[0].toFixed(5)}_${p[1].toFixed(5)}`, p])).values());
}

/** Cuenta filas (checks) por operador según modalidad y filtro de operadores. */
function countOperatorChecks(
    pdvs: MapPdvBt[],
    saleModes: { prepago: boolean; pospago: boolean },
    operatorIds: number[]
): { winner: { id: number; name: string; color: string; count: number } | null; total: number } {
    const counts = new Map<number, { count: number; name: string; color: string }>();
    let total = 0;
    for (const pdv of pdvs) {
        for (const row of filterBtRows(pdv.bt_operators ?? [], saleModes, operatorIds)) {
            total += 1;
            const prev = counts.get(row.operator_id) ?? {
                count: 0,
                name: row.name,
                color: operatorDotColor(row.color),
            };
            counts.set(row.operator_id, {
                count: prev.count + 1,
                name: row.name,
                color: operatorDotColor(row.color),
            });
        }
    }
    if (counts.size === 0) {
        return { winner: null, total: 0 };
    }
    let best: { id: number; name: string; color: string; count: number } | null = null;
    for (const [id, v] of counts) {
        if (
            !best ||
            v.count > best.count ||
            (v.count === best.count && id < best.id)
        ) {
            best = { id, name: v.name, color: v.color, count: v.count };
        }
    }
    return { winner: best, total };
}

function groupPdvsByZonalId(pdvs: MapPdvBt[]): Map<number, { zonalName: string; pdvs: MapPdvBt[] }> {
    const m = new Map<number, { zonalName: string; pdvs: MapPdvBt[] }>();
    for (const p of pdvs) {
        const zid = p.zonal_id;
        if (zid == null || Number.isNaN(Number(zid))) continue;
        const zonalName = (p.zonal_name && String(p.zonal_name).trim()) || `Zonal ${zid}`;
        if (!m.has(zid)) {
            m.set(zid, { zonalName, pdvs: [] });
        }
        m.get(zid)!.pdvs.push(p);
    }
    return m;
}

/** Construye capa Leaflet (polígono, rectángulo o círculo) a partir de puntos [lng,lat] únicos. */
function createHullLayerFromLngLatPts(
    L: any,
    pts: [number, number][],
    polyStyle: { color: string; weight: number; opacity: number; fillColor: string; fillOpacity: number },
    hullPopup: string
): any | null {
    if (pts.length === 0) return null;
    if (pts.length >= 3) {
        const ringLngLat = convexHullLngLat(pts);
        const latLngs = ringLngLat.map(([lng, lat]) => [lat, lng] as [number, number]);
        if (latLngs.length >= 3) {
            return L.polygon(latLngs, polyStyle).bindPopup(hullPopup);
        }
        const lats = pts.map((p) => p[1]);
        const lngs = pts.map((p) => p[0]);
        const b = L.latLngBounds(
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ).pad(0.004);
        return L.rectangle(b, polyStyle).bindPopup(hullPopup);
    }
    if (pts.length === 2) {
        const b = L.latLngBounds(
            [pts[0][1], pts[0][0]],
            [pts[1][1], pts[1][0]]
        ).pad(0.004);
        return L.rectangle(b, polyStyle).bindPopup(hullPopup);
    }
    return L.circle([pts[0][1], pts[0][0]], {
        radius: 280,
        ...polyStyle,
    }).bindPopup(hullPopup);
}

export function TipoNegocioMapView({
    mapFilters,
    enabled = true,
    onClose,
    className,
    embedded = false,
}: TipoNegocioMapViewProps) {
    const { addToast } = useToast();
    const mapRef = useRef<any>(null);
    const hullLayersRef = useRef<any[]>([]);
    const [pdvs, setPdvs] = useState<MapPdvBt[]>([]);
    const [operators, setOperators] = useState<MapOperator[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [selectedOperatorIds, setSelectedOperatorIds] = useState<number[]>([]);
    const [filterPrepago, setFilterPrepago] = useState(true);
    const [filterPospago, setFilterPospago] = useState(true);

    const saleModes = useMemo(
        () => ({ prepago: filterPrepago, pospago: filterPospago }),
        [filterPrepago, filterPospago]
    );

    const params = useMemo(() => {
        const p: Record<string, string> = {};
        if (mapFilters.search) p.search = mapFilters.search;
        if (mapFilters.business_id) p.business_id = mapFilters.business_id;
        if (mapFilters.zonal_id) p.zonal_id = mapFilters.zonal_id;
        if (mapFilters.circuit_id) p.circuit_id = mapFilters.circuit_id;
        if (mapFilters.route_id) p.route_id = mapFilters.route_id;
        if (mapFilters.business_type) p.business_type = mapFilters.business_type;
        return p;
    }, [mapFilters]);

    useEffect(() => {
        if (!enabled) {
            hullLayersRef.current = [];
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setMap(null);
            setMarkers([]);
            setPdvs([]);
            setOperators([]);
            setSelectedOperatorIds([]);
            setFilterPrepago(true);
            setFilterPospago(true);
            return;
        }
        loadMapData();
    }, [enabled, params.search, params.business_id, params.zonal_id, params.circuit_id, params.route_id, params.business_type]);

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
    }, [map, pdvs, selectedOperatorIds, saleModes, mapFilters.zonal_id]);

    useEffect(() => {
        if (enabled && map) setTimeout(() => map.invalidateSize(), 200);
    }, [enabled, map]);

    const loadMapData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('reportes.tipo-de-negocio.map-data'), { params });
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

    const updateMarkers = () => {
        const L = (window as any).L;
        if (!L || !map) return;

        markers.forEach((m) => map.removeLayer(m));
        hullLayersRef.current.forEach((layer) => map.removeLayer(layer));
        hullLayersRef.current = [];

        const newMarkers: any[] = [];

        const opIds = selectedOperatorIds;

        const pdvsWithCoords = pdvs.filter((p) => {
            const lat = Number(p.latitude);
            const lng = Number(p.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
            if (!saleModes.prepago && !saleModes.pospago) return false;
            const dots = getActiveOperatorDots(p, saleModes, opIds);
            return dots.length > 0;
        });

        const zonalGroups = groupPdvsByZonalId(pdvsWithCoords);
        const showZonalHulls = zonalGroups.size > 0 && pdvsWithCoords.length > 0;

        pdvsWithCoords.forEach((pdv) => {
            const lat = Number(pdv.latitude);
            const lng = Number(pdv.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            const dots = getActiveOperatorDots(pdv, saleModes, opIds);
            if (dots.length === 0) return;

            const dotsHtml = dots
                .map(
                    (op) =>
                        `<span class="block w-2.5 h-2.5 rounded-full border border-white shadow flex-shrink-0" style="background-color:${op.color}"></span>`
                )
                .join('');

            const icon = L.divIcon({
                className: 'pdv-bt-operator-marker',
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

        if (showZonalHulls) {
            for (const [, { zonalName, pdvs: groupPdvs }] of zonalGroups) {
                const { winner } = countOperatorChecks(groupPdvs, saleModes, opIds);
                if (!winner) continue;

                const border = winner.color;
                const polyStyle = {
                    color: border,
                    weight: 3,
                    opacity: 0.95,
                    fillColor: border,
                    fillOpacity: 0.18,
                };

                const raw: [number, number][] = groupPdvs.map((p) => [
                    Number(p.longitude),
                    Number(p.latitude),
                ]);
                const pts = uniqueLngLat(raw);

                const hullPopup =
                    `<div class="p-2 text-sm"><strong>${zonalName}</strong><br/>` +
                    `Ganador: <span style="color:${border}">●</span> ${winner.name}<br/>` +
                    `${winner.count} asignaciones (modalidad y operadores)</div>`;

                const hullLayer = createHullLayerFromLngLatPts(L, pts, polyStyle, hullPopup);
                if (hullLayer) {
                    hullLayer.addTo(map);
                    hullLayersRef.current.push(hullLayer);
                }
            }
        }

        setMarkers(newMarkers);
        const fitLayers: any[] = [...newMarkers, ...hullLayersRef.current];
        if (fitLayers.length > 0) {
            const group = L.featureGroup(fitLayers);
            const b = group.getBounds();
            if (b.isValid()) map.fitBounds(b.pad(0.08));
        }
    };

    const handleClose = () => {
        hullLayersRef.current = [];
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
            if (!saleModes.prepago && !saleModes.pospago) return false;
            const dots = getActiveOperatorDots(p, saleModes, selectedOperatorIds);
            return dots.length > 0;
        });
    }, [pdvs, selectedOperatorIds, saleModes]);

    const zonalPerimeterStats = useMemo(() => {
        if (filteredPdvs.length === 0) return null;

        if (mapFilters.zonal_id) {
            const o = countOperatorChecks(filteredPdvs, saleModes, selectedOperatorIds);
            if (!o.winner) return null;
            return { mode: 'single' as const, ...o };
        }

        const groups = groupPdvsByZonalId(filteredPdvs);
        if (groups.size === 0) return null;

        const zones = [...groups.entries()].map(([zonalId, g]) => {
            const o = countOperatorChecks(g.pdvs, saleModes, selectedOperatorIds);
            return {
                zonalId,
                zonalName: g.zonalName,
                winner: o.winner,
                total: o.total,
            };
        }).filter((z) => z.winner);

        if (zones.length === 0) return null;
        return { mode: 'multi' as const, zones };
    }, [mapFilters.zonal_id, filteredPdvs, saleModes, selectedOperatorIds]);

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
                            <h2 className="truncate text-base font-semibold sm:text-lg lg:text-xl">
                                Mapa tipo de negocio
                            </h2>
                            <p className="truncate text-xs text-gray-600 lg:text-sm">
                                Asignaciones por tipo de negocio (prepago/pospago). {filteredPdvs.length} PDVs con
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
                    <div className="mb-3">
                        <span className="text-xs font-medium text-gray-700 sm:text-sm">Modalidad</span>
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                            <div
                                className="flex cursor-pointer items-center space-x-2"
                                onClick={() => setFilterPrepago((v) => !v)}
                            >
                                <Checkbox
                                    id="tipo-negocio-map-prepago"
                                    checked={filterPrepago}
                                    onCheckedChange={(c) => setFilterPrepago(c === true)}
                                    className="border-amber-400 data-[state=checked]:border-amber-600 data-[state=checked]:bg-amber-600"
                                />
                                <label
                                    htmlFor="tipo-negocio-map-prepago"
                                    className="cursor-pointer text-xs font-medium text-gray-800 sm:text-sm"
                                >
                                    Prepago
                                </label>
                            </div>
                            <div
                                className="flex cursor-pointer items-center space-x-2"
                                onClick={() => setFilterPospago((v) => !v)}
                            >
                                <Checkbox
                                    id="tipo-negocio-map-pospago"
                                    checked={filterPospago}
                                    onCheckedChange={(c) => setFilterPospago(c === true)}
                                    className="border-violet-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
                                />
                                <label
                                    htmlFor="tipo-negocio-map-pospago"
                                    className="cursor-pointer text-xs font-medium text-gray-800 sm:text-sm"
                                >
                                    Pospago
                                </label>
                            </div>
                        </div>
                    </div>

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
                            const opColor = operatorDotColor(op.color);
                            return (
                                <div
                                    key={op.id}
                                    className="flex cursor-pointer items-center space-x-2"
                                    onClick={() => toggleOperator(op.id)}
                                >
                                    <Checkbox
                                        id={`tipo-negocio-map-op-${op.id}`}
                                        checked={selectedOperatorIds.includes(op.id)}
                                        onCheckedChange={() => toggleOperator(op.id)}
                                        className="border-pink-300 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
                                    />
                                    <label
                                        htmlFor={`tipo-negocio-map-op-${op.id}`}
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
                        {zonalPerimeterStats?.mode === 'single' && zonalPerimeterStats.winner && (
                            <span className="flex items-center gap-1.5 rounded-md border border-pink-200 bg-pink-50/80 px-2 py-0.5 text-pink-950">
                                <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-white shadow"
                                    style={{ backgroundColor: zonalPerimeterStats.winner.color }}
                                    title={zonalPerimeterStats.winner.name}
                                />
                                Perímetro: ganador {zonalPerimeterStats.winner.name} (
                                {zonalPerimeterStats.winner.count}/{zonalPerimeterStats.total} asignaciones)
                            </span>
                        )}
                        {zonalPerimeterStats?.mode === 'multi' && zonalPerimeterStats.zones.length > 0 && (
                            <span className="max-w-[min(100%,28rem)] rounded-md border border-pink-200 bg-pink-50/80 px-2 py-0.5 text-pink-950">
                                Perímetros por zonal: {zonalPerimeterStats.zones.length} áreas (borde = operador con más
                                asignaciones en cada zonal).
                            </span>
                        )}
                        <span className="text-gray-400">
                            Modalidad y operadores: sin selección en operadores = todos; prepago/pospago filtran filas.
                            {mapFilters.zonal_id
                                ? ' Un contorno en el zonal filtrado.'
                                : ' Con todos los zonales, un contorno por cada zonal visible.'}
                        </span>
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
                                    <p className="text-sm text-gray-600">
                                        {!filterPrepago && !filterPospago
                                            ? 'Marca al menos Prepago o Pospago.'
                                            : 'No hay PDVs con coordenadas o sin filas que coincidan con los filtros.'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Configura tipos de negocio en Negocio - Operador o ajusta modalidad/operadores
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div ref={setMapContainer} className="h-full w-full min-h-[280px] lg:min-h-[380px]" />
                        )}
                    </div>

                    <div className="flex w-full max-w-full flex-shrink-0 flex-col overflow-hidden rounded-lg bg-gray-50 p-3 lg:w-72 xl:w-80">
                        <h3 className="mb-2 flex flex-shrink-0 items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                            <Navigation className="h-4 w-4" />
                            PDVs ({filteredPdvs.length})
                        </h3>
                        <div className="max-h-[min(65vh,560px)] min-h-[120px] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5">
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
                                    {filteredPdvs.map((pdv) => (
                                        <Card
                                            key={pdv.id}
                                            className="cursor-pointer p-2 transition-shadow hover:shadow-md sm:p-3"
                                            onClick={() => {
                                                if (map && pdv.latitude && pdv.longitude) {
                                                    map.setView([Number(pdv.latitude), Number(pdv.longitude)], 16);
                                                }
                                            }}
                                        >
                                            <div className="min-w-0">
                                                <h4 className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                                                    {pdv.point_name}
                                                </h4>
                                                <p className="truncate text-xs text-gray-600">{pdv.client_name}</p>
                                                <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2">
                                                    {filterBtRows(pdv.bt_operators ?? [], saleModes, selectedOperatorIds).map(
                                                        (row, idx) => (
                                                        <li
                                                            key={`${pdv.id}-${row.business_type}-${row.operator_id}-${row.sale_mode}-${idx}`}
                                                            className="flex flex-wrap items-center gap-1 text-[11px] leading-tight text-gray-700"
                                                        >
                                                            <Badge variant="outline" className="px-1 py-0 text-[10px] font-normal">
                                                                {row.business_type}
                                                            </Badge>
                                                            <span className="text-gray-500">{saleModeLabel(row.sale_mode)}</span>
                                                            <span
                                                                className="inline-flex items-center gap-0.5 font-medium"
                                                                title={row.name}
                                                            >
                                                                <span
                                                                    className="h-2 w-2 rounded-full border border-white shadow"
                                                                    style={{ backgroundColor: operatorDotColor(row.color) }}
                                                                />
                                                                {row.name}
                                                            </span>
                                                        </li>
                                                    )
                                                    )}
                                                </ul>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
