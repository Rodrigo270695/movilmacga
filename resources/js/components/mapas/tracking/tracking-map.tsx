import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import 'leaflet/dist/leaflet.css';
import type { GpsLocation } from '@/types/tracking';

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
    onMapModeChange: (mode: 'satellite' | 'street') => void;
    onTileProviderChange: (provider: 'osm' | 'carto' | 'esri' | 'outdoors') => void;
}

export default function TrackingMap({
    mapMode,
    tileProvider,
    realTimeLocations,
    selectedUserRoute,
    onMapModeChange,
    onTileProviderChange
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

        // Marcadores en tiempo real
        realTimeLocations.forEach((location, index) => {
            markers.push(
                <Marker
                    key={`real-time-${location.user.id}-${index}`}
                    position={[location.latitude, location.longitude]}
                >
                    <Popup>
                        <div className="text-sm">
                            <div className="font-semibold">
                                {location.user.first_name} {location.user.last_name}
                            </div>
                            <div className="text-gray-600">
                                Última ubicación: {new Date(location.recorded_at).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Lat: {location.latitude.toFixed(6)}<br />
                                Lng: {location.longitude.toFixed(6)}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );
        });

        return markers;
    };

    // Líneas de ruta
    const createRouteLines = () => {
        if (selectedUserRoute.length < 2) return null;

        const coordinates: LatLngExpression[] = selectedUserRoute.map(location => [
            location.latitude,
            location.longitude
        ]);

        return (
            <Polyline
                positions={coordinates}
                color="blue"
                weight={3}
                opacity={0.7}
            />
        );
    };

    return (
        <div className="flex-1 relative">
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
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                className="z-0"
            >
                <TileLayer
                    key={`${tileProvider}-${mapMode}`}
                    attribution={getTileConfig().attribution}
                    url={getTileConfig().url}
                />
                {createMapMarkers()}
                {createRouteLines()}
            </MapContainer>
        </div>
    );
}
