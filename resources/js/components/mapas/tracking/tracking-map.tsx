import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpsLocation, Pdv, User } from '@/types/tracking';

// Configurar iconos de Leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Icono personalizado para vendedores en línea
const createVendorIcon = (isMoving: boolean = false) => {
    const color = isMoving ? '#10b981' : '#3b82f6'; // Verde si está en movimiento, azul si estático
    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
        ">
            👤
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-vendor-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
    });
};

// Icono personalizado para PDVs
const createPdvIcon = (status: string, classification: string) => {
    // Colores según el estado del PDV
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'vende': return '#10b981'; // Verde
            case 'no vende': return '#f59e0b'; // Ámbar
            case 'no existe': return '#ef4444'; // Rojo
            case 'pdv autoactivado': return '#8b5cf6'; // Púrpura
            case 'pdv impulsador': return '#06b6d4'; // Cian
            default: return '#6b7280'; // Gris
        }
    };

    // Emoji según la clasificación
    const getClassificationEmoji = (classification: string) => {
        switch (classification) {
            case 'telecomunicaciones': return '📱';
            case 'chalequeros': return '👥';
            case 'bodega': return '🏪';
            case 'otras tiendas': return '🏬';
            case 'pusher': return '📢';
            default: return '📍';
        }
    };

    const color = getStatusColor(status);
    const emoji = getClassificationEmoji(classification);

    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
            position: relative;
        ">
            ${emoji}
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-pdv-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

// Icono especial para visitas PDV en la ruta
const createRouteVisitIcon = (visit: any, isStart: boolean = false, isEnd: boolean = false) => {
    let color = '#10b981'; // Verde por defecto (completada)
    let emoji = '✅';

    if (visit.visit_status === 'in_progress') {
        color = '#f59e0b'; // Amarillo para en progreso
        emoji = '⏳';
    } else if (visit.visit_status === 'cancelled') {
        color = '#ef4444'; // Rojo para cancelada
        emoji = '❌';
    }

    if (isStart) {
        color = '#22c55e'; // Verde brillante para inicio
        emoji = '🚀';
    } else if (isEnd) {
        color = '#dc2626'; // Rojo para fin
        emoji = '🏁';
    }

    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            font-weight: bold;
            position: relative;
        ">
            ${emoji}
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-route-visit-icon',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19]
    });
};

// Icono para puntos de inicio y fin de ruta
const createRoutePointIcon = (type: 'start' | 'end') => {
    const color = type === 'start' ? '#22c55e' : '#dc2626';
    const emoji = type === 'start' ? '🏁' : '🎯';

    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            font-weight: bold;
            position: relative;
        ">
            ${emoji}
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-route-point-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

interface RouteCoordinate {
    latitude: number;
    longitude: number;
    recorded_at: string;
}

interface TrackingMapProps {
    mapMode: 'satellite' | 'street';
    tileProvider: 'osm' | 'carto' | 'esri' | 'outdoors';
    realTimeLocations: GpsLocation[];
    selectedUserRoute: RouteCoordinate[];
    selectedUserPdvVisits?: Array<any>; // Visitas PDV del usuario seleccionado
    pdvs: Pdv[];
    showPdvs: boolean;
    users: User[];
    selectedUser?: User | null; // Usuario seleccionado para focus
    showVendorFocus?: boolean; // Indica si estamos en modo focus del vendedor
    onMapModeChange: (mode: 'satellite' | 'street') => void;
    onTileProviderChange: (provider: 'osm' | 'carto' | 'esri' | 'outdoors') => void;
    onTogglePdvs: (show: boolean) => void;
    onClearVendorFocus?: () => void; // Función para limpiar el focus del vendedor
    currentDate?: string;
}

// Componente auxiliar para centrar el mapa
function MapAutoCenter({ locations }: { locations: GpsLocation[] }) {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const { latitude, longitude } = locations[0];
            map.setView([latitude, longitude], 16);
        }
    }, [locations, map]);
    return null;
}

// Componente auxiliar para centrar el mapa en PDVs del vendedor
function VendorMapFocus({ pdvs, userLocation, userRoute }: { pdvs: Pdv[], userLocation?: GpsLocation, userRoute?: RouteCoordinate[] }) {
    const map = useMap();
    useEffect(() => {
        if ((pdvs && pdvs.length > 0) || (userRoute && userRoute.length > 0)) {
            const points: [number, number][] = [];

            // Agregar PDVs
            pdvs.forEach(pdv => {
                if (pdv.latitude && pdv.longitude) {
                    points.push([pdv.latitude, pdv.longitude]);
                }
            });

            // Agregar puntos de la ruta del usuario
            if (userRoute && userRoute.length > 0) {
                userRoute.forEach(point => {
                    points.push([point.latitude, point.longitude]);
                });
            }

            // Agregar ubicación actual del usuario si existe
            if (userLocation) {
                points.push([userLocation.latitude, userLocation.longitude]);
            }

            if (points.length > 0) {
                const bounds = new L.LatLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50] });
                console.log('🎯 Map focused on vendor area:', points.length, 'points');
            }
        }
    }, [pdvs, userLocation, userRoute, map]);
    return null;
}

export default function TrackingMap({
    mapMode,
    tileProvider,
    realTimeLocations,
    selectedUserRoute,
    selectedUserPdvVisits,
    pdvs,
    showPdvs,
    users,
    selectedUser,
    showVendorFocus,
    onMapModeChange,
    onTileProviderChange,
    onTogglePdvs,
    onClearVendorFocus,
    currentDate
}: TrackingMapProps) {
    // Centro del mapa (Lima, Perú)
    const defaultCenter: LatLngExpression = [-12.0464, -77.0428];

    // Configuraciones de proveedores de tiles
    const getTileConfig = () => {
        const configs = {
            osm: {
                street: {
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                },
                satellite: {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
                }
            },
            carto: {
                street: {
                    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                },
                satellite: {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
                }
            },
            esri: {
                street: {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ'
                },
                satellite: {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
                }
            },
            outdoors: {
                street: {
                    url: "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
                    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                },
                satellite: {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
                }
            }
        };

        return configs[tileProvider][mapMode];
    };

    // Marcadores del mapa
    const createMapMarkers = () => {
        const markers: React.ReactElement[] = [];

        // Marcadores en tiempo real - filtrar por usuario seleccionado si está en modo focus
        const locationsToShow = showVendorFocus && selectedUser
            ? realTimeLocations.filter(location => location.user.id === selectedUser.id)
            : realTimeLocations;

        locationsToShow.forEach((location, index) => {
            // Validar que las coordenadas sean números válidos
            if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number' ||
                isNaN(location.latitude) || isNaN(location.longitude) ||
                location.latitude === null || location.longitude === null) {
                console.warn('Ubicación con coordenadas inválidas ignorada:', location);
                return;
            }

            // Determinar si el vendedor está en movimiento
            const isMoving = location.speed && location.speed > 1; // Consideramos movimiento si va > 1 km/h

            markers.push(
                <Marker
                    key={`real-time-${location.user.id}-${index}`}
                    position={[location.latitude, location.longitude]}
                    icon={createVendorIcon(isMoving)}
                >
                    <Popup>
                        <div className="text-sm min-w-[200px]">
                            <div className="font-semibold text-blue-900 mb-2">
                                📍 {location.user.first_name} {location.user.last_name}
                            </div>

                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span className="text-green-700 font-medium">En línea</span>
                                </div>

                                <div className="text-gray-600">
                                    📧 {location.user.email}
                                </div>

                                {location.user.active_user_circuits && location.user.active_user_circuits.length > 0 && (
                                    <div className="text-gray-600">
                                        🚛 {location.user.active_user_circuits.map(uc => uc.circuit.name).join(', ')}
                                    </div>
                                )}

                                <div className="text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                    🕒 Ubicación registrada:<br />
                                    {new Date(location.recorded_at).toLocaleString('es-ES')}
                                    <br />
                                    <span className="text-xs">
                                        {(() => {
                                            const recordedDate = new Date(location.recorded_at);
                                            const today = new Date();
                                            const isToday = recordedDate.toDateString() === today.toDateString();

                                            if (isToday) {
                                                const diffMinutes = Math.round((Date.now() - recordedDate.getTime()) / (1000 * 60));
                                                if (diffMinutes < 1) return '🟢 Justo ahora';
                                                if (diffMinutes < 5) return `🟢 Hace ${diffMinutes} min`;
                                                if (diffMinutes < 30) return `🟡 Hace ${diffMinutes} min`;
                                                if (diffMinutes < 60) return `🟠 Hace ${diffMinutes} min`;
                                                const diffHours = Math.round(diffMinutes / 60);
                                                return `🔴 Hace ${diffHours}h`;
                                            } else {
                                                const diffDays = Math.round((today.getTime() - recordedDate.getTime()) / (1000 * 60 * 60 * 24));
                                                return `📅 Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
                                            }
                                        })()}
                                    </span>
                                </div>

                                {location.accuracy && (
                                    <div className="text-gray-500">
                                        🎯 Precisión: {location.accuracy.toFixed(1)}m
                                    </div>
                                )}

                                {location.speed && location.speed > 0 && (
                                    <div className="text-gray-500">
                                        🚀 Velocidad: {location.speed.toFixed(1)} km/h
                                    </div>
                                )}

                                {location.battery_level && (
                                    <div className="text-gray-500">
                                        🔋 Batería: {location.battery_level}%
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                                    📊 Lat: {location.latitude.toFixed(6)}<br />
                                    📊 Lng: {location.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );
        });

                // Marcadores de PDVs
        if (showPdvs) {
            console.log('🗺️ Rendering PDVs on map:', {
                showPdvs,
                pdvsCount: pdvs.length,
                pdvs: pdvs.slice(0, 3).map(p => ({ id: p.id, name: p.point_name, lat: p.latitude, lng: p.longitude }))
            });

            pdvs.forEach((pdv, index) => {
                // Validar que las coordenadas sean números válidos
                if (typeof pdv.latitude !== 'number' || typeof pdv.longitude !== 'number' ||
                    isNaN(pdv.latitude) || isNaN(pdv.longitude) ||
                    pdv.latitude === null || pdv.longitude === null) {
                    console.warn('❌ PDV con coordenadas inválidas ignorado:', pdv);
                    return;
                }

                try {
                    const lat = pdv.latitude;
                    const lng = pdv.longitude;

                    markers.push(
                        <Marker
                            key={`pdv-${pdv.id}-${index}`}
                            position={[lat, lng]}
                            icon={createPdvIcon(pdv.status, pdv.classification)}
                        >
                        <Popup>
                            <div className="text-sm min-w-[250px]">
                                <div className="font-semibold text-purple-900 mb-2">
                                    🏪 {pdv.point_name}
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full" style={{
                                            backgroundColor: pdv.status === 'vende' ? '#10b981' :
                                                           pdv.status === 'no vende' ? '#f59e0b' :
                                                           pdv.status === 'no existe' ? '#ef4444' :
                                                           pdv.status === 'pdv autoactivado' ? '#8b5cf6' :
                                                           pdv.status === 'pdv impulsador' ? '#06b6d4' : '#6b7280'
                                        }}></span>
                                        <span className="font-medium capitalize">
                                            {pdv.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="text-gray-700">
                                        👤 <strong>Cliente:</strong> {pdv.client_name}
                                    </div>

                                    <div className="text-gray-600">
                                        📄 <strong>Documento:</strong> {pdv.document_type} {pdv.document_number}
                                    </div>

                                    {pdv.pos_id && (
                                        <div className="text-gray-600">
                                            🆔 <strong>POS ID:</strong> {pdv.pos_id}
                                        </div>
                                    )}

                                    <div className="text-gray-600">
                                        🏷️ <strong>Tipo:</strong> {pdv.classification.replace('_', ' ')}
                                    </div>

                                    <div className="text-gray-600">
                                        💰 <strong>Vende recargas:</strong> {pdv.sells_recharge ? 'Sí' : 'No'}
                                    </div>

                                    {pdv.email && (
                                        <div className="text-gray-600">
                                            📧 {pdv.email}
                                        </div>
                                    )}

                                    {pdv.phone && (
                                        <div className="text-gray-600">
                                            📞 {pdv.phone}
                                        </div>
                                    )}

                                    <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
                                        📍 <strong>Dirección:</strong><br />
                                        {pdv.address}
                                        {pdv.reference && (
                                            <><br /><span className="text-gray-500">Ref: {pdv.reference}</span></>
                                        )}
                                    </div>

                                    <div className="text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                        🛤️ <strong>Ruta:</strong> {pdv.route.name} ({pdv.route.code})<br />
                                        🔌 <strong>Circuito:</strong> {pdv.route.circuit.name}<br />
                                        📁 <strong>Zonal:</strong> {pdv.route.circuit.zonal.name}
                                        {pdv.route.circuit.zonal.business && (
                                            <><br />🏢 <strong>Negocio:</strong> {pdv.route.circuit.zonal.business.name}</>
                                        )}
                                    </div>

                                    {/* Información del vendedor asignado */}
                                    <div className="text-blue-600 mt-2 pt-2 border-t border-blue-100 bg-blue-50 p-2 rounded">
                                                                                {(() => {
                                            // Buscar vendedor asignado al circuito de este PDV
                                            // La relación es: PDV -> Route -> Circuit -> UserCircuit -> User
                                            const circuitId = pdv.route.circuit.id;
                                                                                                                                    // Búsqueda simplificada y directa
                                            console.log('🔎 Datos disponibles para búsqueda:', {
                                                totalUsers: users.length,
                                                firstUser: users[0] ? {
                                                    name: users[0].name,
                                                    keys: Object.keys(users[0]),
                                                    hasActiveUserCircuits: !!users[0].activeUserCircuits,
                                                    hasUserCircuits: !!users[0].user_circuits
                                                } : null
                                            });

                                            let assignedVendor = null;

                                                                                        // Buscar en todos los usuarios
                                            for (let user of users) {
                                                console.log(`👨‍💼 Verificando usuario: ${user.name || user.first_name + ' ' + user.last_name}`, {
                                                    email: user.email,
                                                    hasActiveUserCircuits: !!user.activeUserCircuits,
                                                    hasActive_user_circuits: !!user.active_user_circuits,
                                                    activeUserCircuitsLength: user.activeUserCircuits?.length || 0,
                                                    active_user_circuitsLength: user.active_user_circuits?.length || 0,
                                                    // Verificar ambas propiedades
                                                    circuitsActiveUserCircuits: user.activeUserCircuits?.map(c => ({
                                                        circuit_id: c.circuit_id,
                                                        is_active: c.is_active,
                                                        types: typeof c.circuit_id
                                                    })) || [],
                                                    circuitsActive_user_circuits: user.active_user_circuits?.map(c => ({
                                                        circuit_id: c.circuit_id,
                                                        is_active: c.is_active,
                                                        types: typeof c.circuit_id
                                                    })) || []
                                                });

                                                // Intentar con activeUserCircuits (camelCase)
                                                if (user.activeUserCircuits) {
                                                    for (let circuit of user.activeUserCircuits) {
                                                                                                                console.log(`  🔗 [camelCase] Circuito ${circuit.circuit_id} (${typeof circuit.circuit_id}) vs ${circuitId} (${typeof circuitId}), is_active: ${circuit.is_active}`);

                                                        if ((circuit.circuit_id == circuitId || String(circuit.circuit_id) === String(circuitId)) && circuit.is_active === true) {
                                                            console.log(`  ✅ ¡ENCONTRADO! ${user.name || user.first_name} está asignado al circuito ${circuitId}`);
                                                            assignedVendor = user;
                                                            break;
                                                        }
                                                    }
                                                }

                                                // Intentar con active_user_circuits (snake_case)
                                                if (!assignedVendor && user.active_user_circuits) {
                                                    for (let circuit of user.active_user_circuits) {
                                                                                                                console.log(`  🔗 [snake_case] Circuito ${circuit.circuit_id} (${typeof circuit.circuit_id}) vs ${circuitId} (${typeof circuitId}), is_active: ${circuit.is_active}`);

                                                        if ((circuit.circuit_id == circuitId || String(circuit.circuit_id) === String(circuitId)) && circuit.is_active === true) {
                                                            console.log(`  ✅ ¡ENCONTRADO! ${user.name || user.first_name} está asignado al circuito ${circuitId}`);
                                                            assignedVendor = user;
                                                            break;
                                                        }
                                                    }
                                                }

                                                if (assignedVendor) break;
                                            }

                                                                                        console.log(`🎯 Resultado: PDV "${pdv.point_name}" -> Circuit ID: ${circuitId} -> Vendedor: ${assignedVendor?.name || 'NO ENCONTRADO'}`);

                                            if (assignedVendor) {
                                                                                                                                                                                                                                                // Buscar la asignación activa en cualquiera de las dos propiedades
                                                const activeAssignment =
                                                    assignedVendor.activeUserCircuits?.find(uc =>
                                                        (uc.circuit_id == circuitId || String(uc.circuit_id) === String(circuitId)) && uc.is_active === true
                                                    ) ||
                                                    assignedVendor.active_user_circuits?.find(uc =>
                                                        (uc.circuit_id == circuitId || String(uc.circuit_id) === String(circuitId)) && uc.is_active === true
                                                    );

                                                return (
                                                    <>
                                                        👤 <strong>Vendedor Asignado:</strong><br />
                                                        {assignedVendor.name || `${assignedVendor.first_name} ${assignedVendor.last_name}`}<br />
                                                        📧 {assignedVendor.email}
                                                        {activeAssignment?.assigned_date && (
                                                            <><br />📅 <span className="text-gray-500">Desde: {new Date(activeAssignment.assigned_date).toLocaleDateString()}</span></>
                                                        )}
                                                        {assignedVendor.current_location && (
                                                            <><br />📍 <span className="text-green-600">En línea</span></>
                                                        )}
                                                    </>
                                                );
                                            } else {
                                                return (
                                                    <>
                                                        ⚠️ <strong>Sin Vendedor Asignado</strong><br />
                                                        <span className="text-amber-600">Este circuito no tiene vendedor activo</span>
                                                        <br />
                                                        <span className="text-xs text-gray-400">Circuito ID: {circuitId}</span>
                                                    </>
                                                );
                                            }
                                        })()}
                                    </div>



                                    <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                                        📊 Lat: {pdv.latitude.toFixed(6)}<br />
                                        📊 Lng: {pdv.longitude.toFixed(6)}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                    );
                } catch (error) {
                    console.error(`❌ Error creating PDV marker ${index + 1}:`, error, pdv);
                }
            });

                        console.log(`📍 Total markers in array: ${markers.length} (including vendors and PDVs)`);
        } else {
            console.log('🚫 PDVs not shown (showPdvs = false)');
        }

        // Agregar marcadores de visitas PDV en la ruta del usuario seleccionado
        if (selectedUserPdvVisits && selectedUserPdvVisits.length > 0) {
            console.log('🛣️ Adding PDV visit markers to route:', selectedUserPdvVisits.length);

            selectedUserPdvVisits.forEach((visit, index) => {
                try {
                    const isFirstVisit = index === 0;
                    const isLastVisit = index === selectedUserPdvVisits.length - 1;

                    markers.push(
                        <Marker
                            key={`route-visit-${visit.id || index}`}
                            position={[visit.latitude, visit.longitude]}
                            icon={createRouteVisitIcon(visit, isFirstVisit, isLastVisit)}
                        >
                            <Popup>
                                <div className="min-w-[250px] p-2">
                                    <div className="font-bold text-blue-600 mb-2">
                                        📍 Visita PDV en Ruta
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <strong>PDV:</strong> {visit.pdv?.point_name || 'PDV Desconocido'}
                                        </div>

                                        {visit.pdv?.client_name && (
                                            <div>
                                                <strong>Cliente:</strong> {visit.pdv.client_name}
                                            </div>
                                        )}

                                        <div>
                                            <strong>Check-in:</strong> {new Date(visit.check_in_at).toLocaleString()}
                                        </div>

                                        {visit.check_out_at && (
                                            <div>
                                                <strong>Check-out:</strong> {new Date(visit.check_out_at).toLocaleString()}
                                            </div>
                                        )}

                                        <div>
                                            <strong>Estado:</strong> {
                                                visit.visit_status === 'completed' ? '✅ Completada' :
                                                visit.visit_status === 'in_progress' ? '⏳ En progreso' :
                                                visit.visit_status === 'cancelled' ? '❌ Cancelada' :
                                                '❓ Desconocido'
                                            }
                                        </div>

                                        {visit.duration_minutes && (
                                            <div>
                                                <strong>Duración:</strong> {visit.duration_minutes}m
                                            </div>
                                        )}

                                        {visit.distance_to_pdv && (
                                            <div>
                                                <strong>Distancia al PDV:</strong> {visit.distance_to_pdv}m
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                } catch (error) {
                    console.error(`❌ Error creating route visit marker ${index + 1}:`, error, visit);
                }
            });

            console.log(`🛣️ Added ${selectedUserPdvVisits.length} route visit markers`);
        }

        // Agregar puntos de inicio y fin de ruta si hay datos suficientes
        if (selectedUserRoute && selectedUserRoute.length > 1) {
            const startPoint = selectedUserRoute[0];
            const endPoint = selectedUserRoute[selectedUserRoute.length - 1];

            // Marcador de inicio
            markers.push(
                <Marker
                    key="route-start"
                    position={[startPoint.latitude, startPoint.longitude]}
                    icon={createRoutePointIcon('start')}
                >
                    <Popup>
                        <div className="min-w-[200px] p-2">
                            <div className="font-bold text-green-600 mb-2">
                                🚀 Inicio de Ruta
                            </div>
                            <div className="text-sm">
                                <strong>Hora:</strong> {new Date(startPoint.recorded_at).toLocaleString()}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );

            // Marcador de fin
            markers.push(
                <Marker
                    key="route-end"
                    position={[endPoint.latitude, endPoint.longitude]}
                    icon={createRoutePointIcon('end')}
                >
                    <Popup>
                        <div className="min-w-[200px] p-2">
                            <div className="font-bold text-red-600 mb-2">
                                🎯 Fin de Ruta
                            </div>
                            <div className="text-sm">
                                <strong>Hora:</strong> {new Date(endPoint.recorded_at).toLocaleString()}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );

            console.log(`🛣️ Added route start/end markers`);
        }

        console.log(`📍 Total markers in array: ${markers.length} (including vendors, PDVs, route visits, and route points)`);
        return markers;
    };

        // Líneas de ruta - VERSIÓN SIMPLIFICADA EXTREMA
    const createRouteLines = () => {
        console.log('🛣️ DEBUG COMPLETO:', {
            'selectedUserRoute existe': !!selectedUserRoute,
            'selectedUserRoute.length': selectedUserRoute?.length || 0,
            'selectedUser': selectedUser?.first_name || 'null',
            'showVendorFocus': showVendorFocus,
            'primer elemento': selectedUserRoute?.[0] || 'null',
            'datos completos': selectedUserRoute
        });

        // Verificación básica
        if (!selectedUserRoute || selectedUserRoute.length === 0) {
            console.warn('❌ No hay selectedUserRoute o está vacío');
            return null;
        }

        if (selectedUserRoute.length < 2) {
            console.warn('❌ Menos de 2 puntos en la ruta:', selectedUserRoute.length);
            return null;
        }

        // Procesar coordenadas de forma más explícita
        const processedCoords: [number, number][] = [];

        console.log('🔍 Procesando coordenadas:');
        selectedUserRoute.forEach((location, index) => {
            console.log(`  Punto ${index}:`, {
                latitude: location.latitude,
                longitude: location.longitude,
                type_lat: typeof location.latitude,
                type_lng: typeof location.longitude
            });

            const lat = Number(location.latitude);
            const lng = Number(location.longitude);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                processedCoords.push([lat, lng]);
                console.log(`  ✅ Agregado: [${lat}, ${lng}]`);
            } else {
                console.log(`  ❌ Rechazado: [${lat}, ${lng}]`);
            }
        });

        if (processedCoords.length < 2) {
            console.error('❌ Menos de 2 coordenadas válidas después del procesamiento');
            return null;
        }

        console.log('✅ Coordenadas finales para Polyline:', processedCoords);

        // Crear elementos visuales
        const elements = [];

        // DISEÑO UX PROFESIONAL - Paleta moderna y amigable

        // 1. SOMBRA DE RUTA - Profundidad visual
        elements.push(
            <Polyline
                key="route-shadow"
                positions={processedCoords}
                pathOptions={{
                    color: "#1e293b", // Gris azulado elegante
                    weight: 8,
                    opacity: 0.25,
                    lineCap: "round",
                    lineJoin: "round"
                }}
            />
        );

        // 2. RUTA PRINCIPAL - Azul profesional moderno
        elements.push(
            <Polyline
                key="main-route"
                positions={processedCoords}
                pathOptions={{
                    color: "#3b82f6", // Azul confiable y profesional
                    weight: 5,
                    opacity: 0.9,
                    lineCap: "round",
                    lineJoin: "round"
                }}
            />
        );

        // 3. MARCADOR DE INICIO - Verde éxito
        elements.push(
            <Marker
                key="start-marker"
                position={processedCoords[0]}
                icon={L.divIcon({
                    html: `
                        <div style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: white;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 600;
                            font-size: 10px;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                            font-family: system-ui, -apple-system, sans-serif;
                        ">
                            INICIO
                        </div>
                    `,
                    className: 'route-marker-start',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })}
            />
        );

        // 4. MARCADOR DE FIN - Naranja cálido
        elements.push(
            <Marker
                key="end-marker"
                position={processedCoords[processedCoords.length - 1]}
                icon={L.divIcon({
                    html: `
                        <div style="
                            background: linear-gradient(135deg, #f59e0b, #d97706);
                            color: white;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 600;
                            font-size: 11px;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
                            font-family: system-ui, -apple-system, sans-serif;
                        ">
                            FIN
                        </div>
                    `,
                    className: 'route-marker-end',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })}
            />
        );

        // 5. PUNTOS DE PROGRESO - Cada 4 puntos para mostrar progreso sin saturar
        processedCoords.forEach((coord, index) => {
            if (index === 0 || index === processedCoords.length - 1 || index % 4 !== 0) return;

            const progress = index / (processedCoords.length - 1);
            const timePoint = selectedUserRoute[index];

            elements.push(
                <Circle
                    key={`progress-point-${index}`}
                    center={coord}
                    radius={30}
                    pathOptions={{
                        color: "#6366f1", // Índigo suave
                        fillColor: "#a5b4fc", // Índigo claro
                        fillOpacity: 0.6,
                        weight: 2,
                        opacity: 0.8
                    }}
                />
            );
        });

        console.log('✅ Ruta profesional creada con diseño UX avanzado');

        return <>{elements}</>;
    };

    return (
        <div className="flex-1 relative h-[70vh] min-h-[400px]">
                        {/* Contador de vendedores en tiempo real */}
            {realTimeLocations.length > 0 && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                                {showVendorFocus && selectedUser
                                    ? `Vendedor: ${selectedUser.first_name} ${selectedUser.last_name}`
                                    : `${realTimeLocations.length} vendedor${realTimeLocations.length > 1 ? 'es' : ''} rastreado${realTimeLocations.length > 1 ? 's' : ''}`
                                }
                            </span>
                            {showVendorFocus && selectedUserRoute.length > 0 && (
                                <span className="text-xs text-blue-600 font-medium">
                                    🛣️ {selectedUserRoute.length} puntos de ruta
                                </span>
                            )}
                            {currentDate && (
                                <span className="text-xs text-gray-500 mt-1">
                                    📅 {new Date(currentDate + 'T00:00:00').toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                <Button
                    variant={mapMode === 'street' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onMapModeChange('street')}
                >
                    Mapa
                </Button>
                <Button
                    variant={mapMode === 'satellite' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onMapModeChange('satellite')}
                >
                    Satélite
                </Button>

                <Button
                    variant={showPdvs ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTogglePdvs(!showPdvs)}
                    className={`flex items-center gap-1 ${showPdvs ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}`}
                >
                    🏪 PDVs ({pdvs.length}) {showPdvs ? '✓' : ''}
                </Button>

                {/* Botón para limpiar focus del vendedor */}
                {showVendorFocus && selectedUser && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onClearVendorFocus}
                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
                    >
                        👤 {selectedUser.name || `${selectedUser.first_name} ${selectedUser.last_name}`} ❌
                    </Button>
                )}

                <Select value={tileProvider} onValueChange={(value) => onTileProviderChange(value as typeof tileProvider)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                        <SelectItem value="carto">CARTO</SelectItem>
                        <SelectItem value="esri">Esri</SelectItem>
                        <SelectItem value="osm">OpenStreetMap</SelectItem>
                        <SelectItem value="outdoors">Outdoors</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Auto-centrar en ubicaciones de vendedores o en PDVs del vendedor seleccionado */}
                {showVendorFocus ? (
                    <VendorMapFocus
                        pdvs={pdvs}
                        userLocation={realTimeLocations.find(loc => loc.user.id === selectedUser?.id)}
                        userRoute={selectedUserRoute}
                    />
                ) : (
                    <MapAutoCenter locations={realTimeLocations} />
                )}

                <TileLayer {...getTileConfig()} />
                {createMapMarkers()}
                {createRouteLines()}
            </MapContainer>
        </div>
    );
}
