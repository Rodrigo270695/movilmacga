import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import React from 'react';
import 'leaflet/dist/leaflet.css';

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

interface PeruMapProps {
    mapMode: 'satellite' | 'street';
    tileProvider: 'osm' | 'carto' | 'esri' | 'outdoors';
    onMapModeChange: (mode: 'satellite' | 'street') => void;
    onTileProviderChange: (provider: 'osm' | 'carto' | 'esri' | 'outdoors') => void;
}

export default function PeruMap({
    mapMode,
    tileProvider,
    onMapModeChange,
    onTileProviderChange
}: PeruMapProps) {
    // Centro de Perú
    const peruCenter: LatLngExpression = [-9.1900, -75.0152];

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

    return (
        <div className="flex-1 relative bg-gray-100">
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

            {/* Mensaje instructivo */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] text-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        🗺️ Mapa de Perú
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Configura los filtros de búsqueda arriba y presiona "Buscar" para ver los vendedores en tiempo real.
                    </p>
                    <div className="text-sm text-gray-500">
                        📍 Sistema de Rastreo GPS • Monitoreo en Tiempo Real
                    </div>
                </div>
            </div>

            <MapContainer
                center={peruCenter}
                zoom={6}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                className="z-0"
            >
                <TileLayer
                    key={`${tileProvider}-${mapMode}`}
                    attribution={getTileConfig().attribution}
                    url={getTileConfig().url}
                />
            </MapContainer>
        </div>
    );
}
