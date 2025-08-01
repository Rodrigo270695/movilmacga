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
import type { User, Circuit, Zonal, GpsLocation, UserStats, Stats } from '@/types/tracking';

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
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);

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

    // Estado para controlar si se ha realizado una búsqueda
    const [hasSearched, setHasSearched] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    // Referencias
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Función de búsqueda manual
    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (businessFilter !== 'all') params.set('business', businessFilter);
        if (zonalFilter !== 'all') params.set('zonal', zonalFilter);
        if (circuitFilter !== 'all') params.set('circuit', circuitFilter);
        if (dateFrom) params.set('date_from', dateFrom);

        router.get(route('mapas.tracking.index'), Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setHasSearched(true);
                setIsAutoRefresh(true); // Activar auto-refresh después de buscar
            }
        });
    }, [businessFilter, zonalFilter, circuitFilter, dateFrom]);

    // Limpiar filtros y volver al estado inicial
    const clearFilters = () => {
        setBusinessFilter('all');
        setZonalFilter('all');
        setCircuitFilter('all');
        setDateFrom(new Date().toISOString().split('T')[0]);
        setHasSearched(false);
        setIsAutoRefresh(false);
        setSelectedUser(null);
        setFilteredUsers([]);
        setRealTimeLocations([]);
        setSelectedUserRoute([]);
    };

    // Manejar cambio de negocio (resetear zonal y circuito)
    const handleBusinessChange = (value: string) => {
        setBusinessFilter(value);
        setZonalFilter('all');
        setCircuitFilter('all');
    };

    // Manejar cambio de zonal (resetear circuito)
    const handleZonalChange = (value: string) => {
        setZonalFilter(value);
        setCircuitFilter('all');
    };

    // Obtener ubicaciones en tiempo real
    const fetchRealTimeLocations = async () => {
        try {
            const response = await fetch(route('mapas.tracking.locations.real-time'));
            if (response.ok) {
                const data = await response.json();
                setRealTimeLocations(data.locations || []);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error fetching real-time locations:', error);
        }
    };

    // Obtener ruta de usuario específico
    const fetchUserRoute = async (user: User, date: string = dateFrom) => {
        try {
            const response = await fetch(route('mapas.tracking.users.route', { user: user.id }) + `?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedUserRoute(data.locations || []);
            }
        } catch (error) {
            console.error('Error fetching user route:', error);
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
    }, [isAutoRefresh, hasSearched]);

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
                    onCircuitChange={setCircuitFilter}
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
                                users={filteredUsers}
                                userStats={userStats}
                                selectedUser={selectedUser}
                                vendorListExpanded={vendorListExpanded}
                                onUserSelect={(user) => {
                                    setSelectedUser(user);
                                    fetchUserRoute(user);
                                }}
                                onToggleExpanded={() => setVendorListExpanded(!vendorListExpanded)}
                            />

                            {/* Panel central - Mapa con vendedores */}
                            <TrackingMap
                                mapMode={mapMode}
                                tileProvider={tileProvider}
                                realTimeLocations={realTimeLocations}
                                selectedUserRoute={selectedUserRoute}
                                onMapModeChange={setMapMode}
                                onTileProviderChange={setTileProvider}
                            />

                            {/* Panel derecho - Detalles del usuario */}
                            {selectedUser && showUserDetails && (
                                <TrackingUserDetails
                                    selectedUser={selectedUser}
                                    userStats={userStats}
                                    activeTab={activeTab}
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
