import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapSelectorProps {
    latitude?: number;
    longitude?: number;
    address?: string;
    onLocationChange: (lat: number, lng: number, address?: string) => void;
    focusLocation?: string; // Nueva prop para enfocar en una ubicación específica
}

export function MapSelector({
    latitude,
    longitude,
    address,
    onLocationChange,
    focusLocation
}: MapSelectorProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [currentAddress, setCurrentAddress] = useState(address || '');
    const { getCurrentPosition, hasPermission, loading } = useGeolocation();



    // Coordenadas por defecto (Lima, Perú)
    const defaultLat = latitude || -12.0464;
    const defaultLng = longitude || -77.0428;

    // Función para usar la ubicación actual
    const handleUseCurrentLocation = async () => {
        try {
            const currentPos = await getCurrentPosition();
            if (currentPos && mapInstanceRef.current && markerRef.current) {
                const { latitude: lat, longitude: lng } = currentPos;

                // Actualizar el mapa y marcador
                mapInstanceRef.current.setView([lat, lng], 16);
                markerRef.current.setLatLng([lat, lng]);

                // Obtener dirección de la ubicación actual
                const newAddress = await reverseGeocode(lat, lng);
                setCurrentAddress(newAddress);
                onLocationChange(lat, lng, newAddress);
            }
        } catch (error) {
            console.warn('Error obteniendo ubicación actual:', error);
            alert('No se pudo obtener tu ubicación. Asegúrate de haber dado permisos de ubicación.');
        }
    };

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

                // Crear el mapa BÁSICO sin ninguna funcionalidad de geolocalización
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

        // Agregar tiles básicos
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // No bloquear geolocation - solo no usarla

        mapInstanceRef.current = map;

        // Agregar marcador inicial
        const marker = L.marker([defaultLat, defaultLng], {
            draggable: true
        }).addTo(map);

        markerRef.current = marker;

        // Evento cuando se arrastra el marcador
        marker.on('dragend', async (e) => {
            const position = e.target.getLatLng();

            // Obtener dirección inversa
            try {
                const address = await reverseGeocode(position.lat, position.lng);
                setCurrentAddress(address);
                onLocationChange(position.lat, position.lng, address);
            } catch (error) {
                console.warn('No se pudo obtener la dirección:', error);
                onLocationChange(position.lat, position.lng);
            }
        });

        // Evento de click en el mapa
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;

            // Mover marcador a la nueva posición
            marker.setLatLng([lat, lng]);

            // Obtener dirección inversa
            try {
                const address = await reverseGeocode(lat, lng);
                setCurrentAddress(address);
                onLocationChange(lat, lng, address);
            } catch (error) {
                console.warn('No se pudo obtener la dirección:', error);
                onLocationChange(lat, lng);
            }
        });

        return () => {
            // Limpieza completa del mapa
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

        // Actualizar marcador y vista cuando cambien las coordenadas
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
            const newLatLng = L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            mapInstanceRef.current.setView(newLatLng, 15); // Centrar y hacer zoom
        }
    }, [latitude, longitude]);

    // Actualizar dirección cuando cambie desde el formulario
    useEffect(() => {
        if (address && address !== currentAddress) {
            setCurrentAddress(address);
        }
    }, [address]);

    // Función para enfocar en una ubicación específica sin mover el marcador
    const focusOnLocationOnly = async (locationName: string) => {
        if (!locationName || !mapInstanceRef.current) return;

        try {
            // Construir búsqueda específica para Perú
            const searchQuery = `${locationName}, Peru`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=pe`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                // Determinar nivel de zoom según el tipo de ubicación
                let zoomLevel = 8; // Por defecto para departamentos (vista amplia)

                if (locationName.includes('departamento')) {
                    zoomLevel = 8; // Vista de departamento
                } else if (locationName.includes('provincia')) {
                    zoomLevel = 10; // Vista de provincia
                } else if (locationName.includes('distrito')) {
                    zoomLevel = 12; // Vista de distrito
                } else if (locationName.includes('localidad')) {
                    zoomLevel = 14; // Vista de localidad (más detallada)
                }

                // Solo enfocar el mapa, NO mover el marcador
                mapInstanceRef.current.setView([lat, lng], zoomLevel);
            }
        } catch (error) {
            console.warn('Error enfocando en ubicación:', error);
        }
    };

    // Escuchar cambios en focusLocation para enfocar dinámicamente
    useEffect(() => {
        if (focusLocation) {
            focusOnLocationOnly(focusLocation);
        }
    }, [focusLocation]);

    // Geocodificación: convertir dirección a coordenadas
    const geocodeAddress = async (address: string) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                // Actualizar mapa y marcador
                if (mapInstanceRef.current && markerRef.current) {
                    const newLatLng = L.latLng(lat, lng);
                    markerRef.current.setLatLng(newLatLng);
                    mapInstanceRef.current.setView(newLatLng, 15);
                }

                onLocationChange(lat, lng, address);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en geocodificación:', error);
            return false;
        }
    };

    // Geocodificación inversa: convertir coordenadas a dirección
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();

            if (data && data.display_name) {
                return data.display_name;
            }
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    // Manejar búsqueda de dirección
    const handleAddressSearch = async () => {
        if (currentAddress.trim()) {
            const success = await geocodeAddress(currentAddress);
            if (!success) {
                alert('No se pudo encontrar la dirección. Intenta con una dirección más específica.');
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                    placeholder="Ingresa una dirección para buscar..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                    type="button"
                    onClick={handleAddressSearch}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                    <MapPin className="w-4 h-4 mr-1" />
                    Buscar
                </Button>
                {hasPermission && (
                    <Button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap border-green-500 text-green-600 hover:bg-green-50"
                    >
                        <Navigation className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Mi Ubicación
                    </Button>
                )}
            </div>

            <div
                ref={mapRef}
                className="w-full h-64 border border-gray-300 rounded-lg"
                style={{ minHeight: '256px' }}
            />

            <p className="text-xs text-gray-600">
                💡 Haz clic en el mapa o arrastra el marcador para seleccionar una ubicación
            </p>
        </div>
    );
}
