import { useState, useEffect, useCallback } from 'react';

interface Position {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

interface GeolocationError {
    code: number;
    message: string;
}

interface UseGeolocationReturn {
    position: Position | null;
    error: GeolocationError | null;
    loading: boolean;
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
    getCurrentPosition: () => Promise<Position>;
    watchPosition: (options?: PositionOptions) => number | null;
    clearWatch: (watchId: number) => void;
}

export function useGeolocation(): UseGeolocationReturn {
    const [position, setPosition] = useState<Position | null>(null);
    const [error, setError] = useState<GeolocationError | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    // Verificar permisos de geolocalización
    const checkPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setError({
                code: 0,
                message: 'Geolocalización no es compatible con este navegador'
            });
            return false;
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            const granted = permission.state === 'granted';
            setHasPermission(granted);

            // Escuchar cambios en los permisos
            permission.onchange = () => {
                setHasPermission(permission.state === 'granted');
            };

            return granted;
        } catch (error) {
            // Fallback para navegadores que no soportan permissions API
            return false;
        }
    }, []);

    // Solicitar permisos de geolocalización
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!navigator.geolocation) {
            setError({
                code: 0,
                message: 'Geolocalización no es compatible con este navegador'
            });
            return false;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setHasPermission(true);
                    setError(null);
                    resolve(true);
                },
                (error) => {
                    setHasPermission(false);
                    setError({
                        code: error.code,
                        message: getErrorMessage(error.code)
                    });
                    resolve(false);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }, []);

    // Obtener posición actual
    const getCurrentPosition = useCallback(async (): Promise<Position> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no es compatible con este navegador'));
                return;
            }

            setLoading(true);
            setError(null);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos: Position = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };

                    setPosition(pos);
                    setLoading(false);
                    resolve(pos);
                },
                (error) => {
                    const geoError: GeolocationError = {
                        code: error.code,
                        message: getErrorMessage(error.code)
                    };

                    setError(geoError);
                    setLoading(false);
                    reject(geoError);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000
                }
            );
        });
    }, []);

    // Vigilar cambios de posición
    const watchPosition = useCallback((options?: PositionOptions): number | null => {
        if (!navigator.geolocation) {
            setError({
                code: 0,
                message: 'Geolocalización no es compatible con este navegador'
            });
            return null;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const pos: Position = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                setPosition(pos);
                setError(null);
            },
            (error) => {
                setError({
                    code: error.code,
                    message: getErrorMessage(error.code)
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000,
                ...options
            }
        );

        return watchId;
    }, []);

    // Limpiar vigilancia de posición
    const clearWatch = useCallback((watchId: number) => {
        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Verificar permisos al montar el componente
    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    return {
        position,
        error,
        loading,
        hasPermission,
        requestPermission,
        getCurrentPosition,
        watchPosition,
        clearWatch
    };
}

// Helper function para convertir códigos de error a mensajes legibles
function getErrorMessage(code: number): string {
    switch (code) {
        case 1:
            return 'Acceso a la ubicación denegado por el usuario';
        case 2:
            return 'Ubicación no disponible';
        case 3:
            return 'Tiempo de espera agotado al obtener la ubicación';
        default:
            return 'Error desconocido al obtener la ubicación';
    }
}
