import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

// Importar componentes modulares
import TrackingHeader from '@/components/mapas/tracking/tracking-header';
import TrackingFilters from '@/components/mapas/tracking/tracking-filters';
import TrackingMap from '@/components/mapas/tracking/tracking-map';
import TrackingUserList from '@/components/mapas/tracking/tracking-user-list';
import TrackingUserDetails from '@/components/mapas/tracking/tracking-user-details';
import PeruMap from '@/components/mapas/tracking/peru-map';

// Importar tipos compartidos
import type { User, Circuit, Zonal, GpsLocation, UserStats, Stats, Pdv } from '@/types/tracking';

interface Props {
    users: { data: User[] };
    circuits: Circuit[];
    zonales: Zonal[];
    userStats: Record<number, UserStats>;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        circuit?: string;
        zonal?: string;
        date_from?: string;
        date_to?: string;
        vendor?: string;
    };
}

export default function TrackingDashboard({ users, circuits, zonales, userStats, stats }: Props) {
    // Estados del dashboard
    const [businessFilter, setBusinessFilter] = useState('all');
    const [zonalFilter, setZonalFilter] = useState('all');
    const [circuitFilter, setCircuitFilter] = useState('all');
        // Usar fecha actual (2025-08-06 para datos de prueba)
    const getCurrentDate = () => {
        return '2025-08-06'; // Fecha fija para coincidir con los datos de prueba
    };

    const [dateFrom, setDateFrom] = useState(getCurrentDate());

    // Estados de la interfaz
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAutoRefresh, setIsAutoRefresh] = useState(false); // Inicialmente apagado
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [realTimeLocations, setRealTimeLocations] = useState<GpsLocation[]>([]);
    const [showUserDetails, setShowUserDetails] = useState(true);
    const [mapMode, setMapMode] = useState<'satellite' | 'street'>('street');
    const [tileProvider, setTileProvider] = useState<'osm' | 'carto' | 'esri' | 'outdoors'>('carto');
    const [activeTab, setActiveTab] = useState('overview');
    const [vendorListExpanded, setVendorListExpanded] = useState(true);
    const [selectedUserRoute, setSelectedUserRoute] = useState<Array<{ latitude: number; longitude: number; recorded_at: string }>>([]);
    const [selectedUserPdvVisits, setSelectedUserPdvVisits] = useState<Array<any>>([]);

    // Estados para PDVs
    const [pdvs, setPdvs] = useState<Pdv[]>([]);
    const [showPdvs, setShowPdvs] = useState(false);
    const [vendorPdvs, setVendorPdvs] = useState<Pdv[]>([]); // PDVs específicos del vendedor seleccionado
    const [showVendorFocus, setShowVendorFocus] = useState(false); // Estado para mostrar focus del vendedor

    // Estado para controlar si se ha realizado una búsqueda
    const [hasSearched, setHasSearched] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>(users.data);

    // Referencias
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Función de búsqueda manual con filtros integrados
    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (businessFilter !== 'all') params.set('business', businessFilter);
        if (zonalFilter !== 'all') params.set('zonal', zonalFilter);
        if (circuitFilter !== 'all') params.set('circuit', circuitFilter);
        if (dateFrom) params.set('date_from', dateFrom);



        // Aplicar filtros localmente primero para respuesta inmediata
        applyLocalFilters();

        // Luego hacer la búsqueda en el servidor para datos actualizados
        router.get(route('mapas.tracking.index'), Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setHasSearched(true);
                setIsAutoRefresh(true); // Activar auto-refresh después de buscar
                // Cargar datos filtrados automáticamente
                setTimeout(() => {
                    fetchRealTimeLocations();
                    fetchFilteredPdvs();
                    setShowPdvs(true);
                }, 500);
            }
        });
    }, [businessFilter, zonalFilter, circuitFilter, dateFrom]);

    // Aplicar filtros localmente para respuesta inmediata
    const applyLocalFilters = useCallback(() => {
        let filtered = users.data;

                        // Filtro por empresa
        if (businessFilter !== 'all') {
            filtered = filtered.filter(user => {
                return user.activeUserCircuits?.some(uc => {
                    const businessName = uc.circuit?.zonal?.business?.name;
                    return businessName === businessFilter;
                });
            });
        }

        // Filtro por zonal
        if (zonalFilter !== 'all') {
            filtered = filtered.filter(user =>
                user.activeUserCircuits?.some(uc =>
                    uc.circuit?.zonal?.id.toString() === zonalFilter
                )
            );
        }

        // Filtro por circuito
        if (circuitFilter !== 'all') {
            filtered = filtered.filter(user =>
                user.activeUserCircuits?.some(uc =>
                    uc.circuit?.id.toString() === circuitFilter
                )
            );
        }

        setFilteredUsers(filtered);
    }, [users.data, businessFilter, zonalFilter, circuitFilter]);

    // Función para limpiar el focus del vendedor
    const clearVendorFocus = () => {
        setShowVendorFocus(false);
        setVendorPdvs([]);
        setSelectedUser(null);
        setSelectedUserRoute([]);
        setSelectedUserPdvVisits([]);
    };

    // Limpiar filtros y volver al estado inicial
    const clearFilters = () => {
        setBusinessFilter('all');
        setZonalFilter('all');
        setCircuitFilter('all');
        setDateFrom(getCurrentDate()); // Volver a fecha de datos de prueba
        setHasSearched(false);
        clearVendorFocus(); // También limpiar el focus del vendedor
        setIsAutoRefresh(false);
        setSelectedUser(null);
        setFilteredUsers([]);
        setRealTimeLocations([]);
        setSelectedUserRoute([]);
        setSelectedUserPdvVisits([]);
        setPdvs([]);
    };

    // Manejar cambio de negocio (resetear zonal y circuito)
    const handleBusinessChange = (value: string) => {
        setBusinessFilter(value);
        setZonalFilter('all');
        setCircuitFilter('all');
        // Aplicar filtros automáticamente cuando cambie la empresa
        setTimeout(() => applyLocalFilters(), 100);
    };

    // Manejar cambio de zonal (resetear circuito)
    const handleZonalChange = (value: string) => {
        setZonalFilter(value);
        setCircuitFilter('all');
        // Aplicar filtros automáticamente cuando cambie el zonal
        setTimeout(() => applyLocalFilters(), 100);
    };

    // Manejar cambio de circuito
    const handleCircuitChange = (value: string) => {
        setCircuitFilter(value);
        // Aplicar filtros automáticamente cuando cambie el circuito
        setTimeout(() => applyLocalFilters(), 100);
    };

        // Obtener ubicaciones en tiempo real con filtros integrados
    const fetchRealTimeLocations = async () => {
        try {
            // Incluir todos los filtros activos en la petición
            const url = new URL(route('mapas.tracking.locations.real-time'));
            url.searchParams.set('date_from', dateFrom);
            if (businessFilter !== 'all') url.searchParams.set('business', businessFilter);
            if (zonalFilter !== 'all') url.searchParams.set('zonal', zonalFilter);
            if (circuitFilter !== 'all') url.searchParams.set('circuit', circuitFilter);



            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();

                // Convertir coordenadas a número antes de filtrar
                const validLocations = (data.locations || []).map((location: any) => ({
                    ...location,
                    latitude: typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude,
                    longitude: typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude,
                })).filter((location: any) => {
                    return location &&
                           typeof location.latitude === 'number' &&
                           typeof location.longitude === 'number' &&
                           !isNaN(location.latitude) &&
                           !isNaN(location.longitude) &&
                           location.latitude !== null &&
                           location.longitude !== null;
                });
                setRealTimeLocations(validLocations);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error fetching real-time locations:', error);
        }
    };

    // Obtener PDVs filtrados
    const fetchFilteredPdvs = async () => {
        try {


            const params = new URLSearchParams();
            if (businessFilter !== 'all') params.set('business', businessFilter);
            if (zonalFilter !== 'all') params.set('zonal', zonalFilter);
            if (circuitFilter !== 'all') params.set('circuit', circuitFilter);

            const url = route('mapas.tracking.pdvs.filtered') + `?${params.toString()}`;

            const response = await fetch(url);
                        if (response.ok) {
                const data = await response.json();


                if (data.pdvs && data.pdvs.length > 0) {
                    console.log('🗺️ Sample PDV coordinates:', data.pdvs.slice(0, 2).map(p => ({
                        name: p.point_name,
                        lat: p.latitude,
                        lng: p.longitude,
                        latType: typeof p.latitude,
                        lngType: typeof p.longitude
                    })));

                    // Convertir coordenadas a números si vienen como strings
                    const processedPdvs = data.pdvs.map(pdv => ({
                        ...pdv,
                        latitude: typeof pdv.latitude === 'string' ? parseFloat(pdv.latitude) : pdv.latitude,
                        longitude: typeof pdv.longitude === 'string' ? parseFloat(pdv.longitude) : pdv.longitude
                    }));

                    console.log('🔧 Processed PDVs sample:', processedPdvs.slice(0, 2).map(p => ({
                        name: p.point_name,
                        lat: p.latitude,
                        lng: p.longitude,
                        latType: typeof p.latitude,
                        lngType: typeof p.longitude
                    })));

                    setPdvs(processedPdvs);
                } else {
                    setPdvs(data.pdvs || []);
                }
            } else {
                console.error('❌ Error response:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error fetching PDVs:', error);
        }
    };

    // Obtener PDVs asignados al vendedor seleccionado
    const fetchVendorPdvs = async (user: User) => {
        try {
            console.log('🔍 Fetching PDVs for vendor:', user.name);

            // Obtener los circuit IDs del vendedor
            const vendorCircuitIds = user.active_user_circuits?.map(uc => uc.circuit_id) || [];

            if (vendorCircuitIds.length === 0) {
                console.log('⚠️ Vendor has no circuits assigned');
                setVendorPdvs([]);
                return;
            }

            console.log('🔗 Vendor circuit IDs:', vendorCircuitIds);

            // Filtrar PDVs por los circuitos del vendedor
            const vendorSpecificPdvs = pdvs.filter(pdv =>
                vendorCircuitIds.includes(pdv.route.circuit.id)
            );

            console.log('🏪 Found PDVs for vendor:', vendorSpecificPdvs.length);
            setVendorPdvs(vendorSpecificPdvs);
            setShowVendorFocus(true);

        } catch (error) {
            console.error('❌ Error fetching vendor PDVs:', error);
            setVendorPdvs([]);
        }
    };

    // Obtener ruta de usuario específico
    const fetchUserRoute = async (user: User, date: string = dateFrom) => {
        try {
            console.log('🛣️ Fetching complete route for user:', user.name, 'date:', date);
            const response = await fetch(route('mapas.tracking.users.route', { user: user.id }) + `?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                console.log('🛣️ Route data received:', data);

                // Filtrar ubicaciones GPS con coordenadas válidas - DEPURACIÓN COMPLETA
                const validLocations = (data.locations || []).filter((location: any, index: number) => {
                    console.log(`🔍 Validando ubicación ${index}:`, {
                        location,
                        hasLocation: !!location,
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                        latType: typeof location?.latitude,
                        lngType: typeof location?.longitude,
                        latIsNumber: typeof location?.latitude === 'number',
                        lngIsNumber: typeof location?.longitude === 'number',
                        latNotNaN: !isNaN(location?.latitude),
                        lngNotNaN: !isNaN(location?.longitude),
                        latNotNull: location?.latitude !== null,
                        lngNotNull: location?.longitude !== null
                    });

                    if (!location) {
                        console.log(`❌ ${index}: Sin ubicación`);
                        return false;
                    }

                    // Convertir a number si es string
                    const lat = typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude;
                    const lng = typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude;

                    const isValid = lat !== null &&
                                   lng !== null &&
                                   !isNaN(lat) &&
                                   !isNaN(lng) &&
                                   lat !== 0 &&
                                   lng !== 0;

                    if (isValid) {
                        console.log(`✅ ${index}: Válida [${lat}, ${lng}]`);
                        // Actualizar la ubicación con valores convertidos
                        location.latitude = lat;
                        location.longitude = lng;
                    } else {
                        console.log(`❌ ${index}: Inválida [${lat}, ${lng}]`);
                    }

                    return isValid;
                });

                // Filtrar visitas PDV con coordenadas válidas
                const validPdvVisits = (data.pdv_visits || []).filter((visit: any) => {
                    if (!visit) return false;

                    const lat = typeof visit.latitude === 'string' ? parseFloat(visit.latitude) : visit.latitude;
                    const lng = typeof visit.longitude === 'string' ? parseFloat(visit.longitude) : visit.longitude;

                    const isValid = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

                    if (isValid) {
                        visit.latitude = lat;
                        visit.longitude = lng;
                    }

                    return isValid;
                });

                console.log('🛣️ Valid GPS locations:', validLocations.length);
                console.log('🏪 Valid PDV visits:', validPdvVisits.length);

                if (validLocations.length > 0) {
                    console.log('📍 Sample route points:', validLocations.slice(0, 3).map(l => ({
                        lat: l.latitude,
                        lng: l.longitude,
                        time: l.recorded_at
                    })));
                    console.log('🗺️ Setting route for display with', validLocations.length, 'points');
                } else {
                    console.warn('❌ No valid GPS locations found - route will not display');
                }

                setSelectedUserRoute(validLocations);
                setSelectedUserPdvVisits(validPdvVisits);
            }
        } catch (error) {
            console.error('❌ Error fetching user route:', error);
        }
    };

    // Auto-refresh (solo cuando se ha buscado)
    useEffect(() => {
        if (isAutoRefresh && hasSearched) {
            fetchRealTimeLocations();
            autoRefreshIntervalRef.current = setInterval(() => {
                fetchRealTimeLocations();
            }, 30000);
        }
        return () => {
            if (autoRefreshIntervalRef.current) {
                clearInterval(autoRefreshIntervalRef.current);
            }
        };
    }, [isAutoRefresh, hasSearched, dateFrom]); // Agregado dateFrom para que se actualice al cambiar fecha

    // Actualizar usuarios filtrados cuando lleguen datos del servidor
    useEffect(() => {
        if (hasSearched && users.data.length > 0) {
            const sorted = users.data.sort((a, b) => {
                const aStats = userStats[a.id];
                const bStats = userStats[b.id];
                if (!aStats || !bStats) return 0;
                return bStats.compliance_percentage - aStats.compliance_percentage;
            });
            setFilteredUsers(sorted);
        }
    }, [users.data, userStats, hasSearched]);

    // Ejecutar búsqueda automáticamente cuando cambien los filtros (solo si ya se ha buscado)
    useEffect(() => {
        if (hasSearched) {


            // Pequeño delay para evitar múltiples llamadas rápidas
            const timeoutId = setTimeout(() => {
                handleSearch();
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [businessFilter, zonalFilter, circuitFilter, hasSearched]);

    // Efecto para cargar PDVs cuando se activa/desactiva o cambian filtros
    useEffect(() => {
        if (showPdvs && hasSearched) {
            fetchFilteredPdvs();
        }
    }, [showPdvs, businessFilter, zonalFilter, circuitFilter, hasSearched]);

    // Actualizar PDVs del vendedor cuando cambien los PDVs generales
    useEffect(() => {
        if (selectedUser && pdvs.length > 0) {
            fetchVendorPdvs(selectedUser);
        }
    }, [pdvs, selectedUser]);

    // Función para toggle de PDVs
    const handleTogglePdvs = (show: boolean) => {
        console.log('🏪 Toggle PDVs:', { show, hasSearched, pdvsCount: pdvs.length });
        setShowPdvs(show);
        if (show && hasSearched) {
            fetchFilteredPdvs();
        }
    };

    return (
        <>
            <Head title="Sistema de Rastreo Avanzado" />

            <div className="h-screen flex flex-col bg-gray-50">
                {/* Header con estadísticas (solo mostrar si se ha buscado) */}
                {hasSearched && (
                    <TrackingHeader
                        stats={stats}
                        isAutoRefresh={isAutoRefresh}
                        showFilters={true}
                        lastUpdate={lastUpdate}
                        onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
                        onToggleFilters={() => {}} // No usamos toggle de filtros
                    />
                )}

                {/* Panel de filtros (siempre visible) */}
                <TrackingFilters
                    businessFilter={businessFilter}
                    zonalFilter={zonalFilter}
                    circuitFilter={circuitFilter}
                    dateFrom={dateFrom}
                    dateTo={dateFrom} // Usar la misma fecha para ambos
                    zonales={zonales}
                    circuits={circuits}
                    onBusinessChange={handleBusinessChange}
                    onZonalChange={handleZonalChange}
                    onCircuitChange={handleCircuitChange}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateFrom} // No necesitamos dateTo separado
                    onSearch={handleSearch}
                    onClearFilters={clearFilters}
                />

                {/* Contenido principal */}
                <div className="flex-1 flex overflow-hidden">
                    {hasSearched ? (
                        <>
                            {/* Panel izquierdo - Lista de usuarios */}
                            <TrackingUserList
                                users={hasSearched ? filteredUsers : users.data}
                                userStats={userStats}
                                selectedUser={selectedUser}
                                vendorListExpanded={vendorListExpanded}
                                onUserSelect={(user) => {
                                    setSelectedUser(user);
                                    fetchUserRoute(user);
                                    fetchVendorPdvs(user); // Obtener PDVs del vendedor
                                    setShowVendorFocus(true); // Activar modo focus automáticamente
                                    console.log('👤 User selected:', user.name);
                                }}
                                onToggleExpanded={() => setVendorListExpanded(!vendorListExpanded)}
                            />

                            {/* Panel central - Mapa con vendedores */}
                            <div className="flex-1 relative">
                                <TrackingMap
                                    mapMode={mapMode}
                                    tileProvider={tileProvider}
                                    realTimeLocations={realTimeLocations}
                                    selectedUserRoute={selectedUserRoute}
                                    selectedUserPdvVisits={selectedUserPdvVisits} // Visitas PDV de la ruta
                                    pdvs={showVendorFocus ? vendorPdvs : pdvs} // Usar PDVs del vendedor si está en focus
                                    showPdvs={showVendorFocus || showPdvs} // Mostrar PDVs si hay focus o están habilitados
                                    users={users.data}
                                    selectedUser={selectedUser} // Pasar usuario seleccionado
                                    showVendorFocus={showVendorFocus} // Indicar si estamos en modo focus
                                    onMapModeChange={setMapMode}
                                    onTileProviderChange={setTileProvider}
                                    onTogglePdvs={handleTogglePdvs}
                                    onClearVendorFocus={clearVendorFocus} // Función para limpiar focus
                                    currentDate={dateFrom}
                                />

                                {/* Mensaje cuando no hay vendedores con datos del día */}
                                {hasSearched && realTimeLocations.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-200 text-center max-w-md pointer-events-auto">
                                            <div className="text-gray-400 mb-3">
                                                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L5.05 4.05zM4.343 4.343L14.95 14.95a7 7 0 00-10.607-10.607zM10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                No hay vendedores con datos en el día
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                No se detectaron vendedores activos ni ubicaciones para la fecha seleccionada.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Panel derecho - Detalles del usuario */}
                            {selectedUser && showUserDetails && (
                                <TrackingUserDetails
                                    selectedUser={selectedUser}
                                    userStats={userStats}
                                    activeTab={activeTab}
                                    currentDate={dateFrom}
                                    onTabChange={setActiveTab}
                                    onClose={() => setSelectedUser(null)}
                                    onLoadRoute={fetchUserRoute}
                                />
                            )}
                        </>
                    ) : (
                        /* Estado inicial - Solo mapa de Perú */
                        <PeruMap
                            mapMode={mapMode}
                            tileProvider={tileProvider}
                            onMapModeChange={setMapMode}
                            onTileProviderChange={setTileProvider}
                        />
                    )}
                </div>

                {/* Botón flotante para mostrar panel de detalles */}
                {hasSearched && selectedUser && !showUserDetails && (
                    <Button
                        className="fixed bottom-4 right-4 z-50"
                        onClick={() => setShowUserDetails(true)}
                    >
                        Mostrar detalles
                    </Button>
                )}
            </div>
        </>
    );
}
