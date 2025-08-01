import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

// Importar componentes modulares
import TrackingHeader from '@/components/mapas/tracking/tracking-header';
import TrackingFilters from '@/components/mapas/tracking/tracking-filters';
import TrackingMap from '@/components/mapas/tracking/tracking-map';
import TrackingUserList from '@/components/mapas/tracking/tracking-user-list';
import TrackingUserDetails from '@/components/mapas/tracking/tracking-user-details';

// Interfaces
interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    active_working_sessions: any[];
    active_user_circuits: Array<{ circuit: { name: string; code: string } }>;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
}

interface Zonal {
    id: number;
    name: string;
    business: { id: number; name: string };
}

interface GpsLocation {
    id: number;
    latitude: number;
    longitude: number;
    recorded_at: string;
    user: User;
}

interface UserStats {
    total_sessions: number;
    working_hours: number;
    distance_traveled: number;
    pdv_visits: number;
    programmed_pdvs: number;
    compliance_percentage: number;
    last_activity: string;
    route_coordinates: Array<{ latitude: number; longitude: number; recorded_at: string }>;
    pdv_visits_detail: Array<{ pdv: string; visited_at: string; duration?: number }>;
}

interface Stats {
    total_users: number;
    online_users: number;
    active_sessions: number;
    total_circuits: number;
}

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

export default function TrackingDashboard({ users, circuits, zonales, userStats, stats, filters }: Props) {
    // Estados del dashboard
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [circuitFilter, setCircuitFilter] = useState(filters.circuit || 'all');
    const [zonalFilter, setZonalFilter] = useState(filters.zonal || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(filters.date_to || new Date().toISOString().split('T')[0]);
    const [vendorFilter, setVendorFilter] = useState(filters.vendor || 'all');

    // Estados de la interfaz
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
    const [realTimeLocations, setRealTimeLocations] = useState<GpsLocation[]>([]);
    const [showUserDetails, setShowUserDetails] = useState(true);
    const [showFilters, setShowFilters] = useState(true);
    const [mapMode, setMapMode] = useState<'satellite' | 'street'>('street');
    const [tileProvider, setTileProvider] = useState<'osm' | 'carto' | 'esri' | 'outdoors'>('carto');
    const [activeTab, setActiveTab] = useState('overview');
    const [vendorListExpanded, setVendorListExpanded] = useState(true);
    const [selectedUserRoute, setSelectedUserRoute] = useState<Array<{ latitude: number; longitude: number; recorded_at: string }>>([]);

    // Referencias
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Manejar cambios de filtros
    const handleFilterChange = useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (circuitFilter !== 'all') params.set('circuit', circuitFilter);
        if (zonalFilter !== 'all') params.set('zonal', zonalFilter);
        if (vendorFilter !== 'all') params.set('vendor', vendorFilter);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);

        router.get(route('mapas.tracking.index'), Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm, statusFilter, circuitFilter, zonalFilter, vendorFilter, dateFrom, dateTo]);

    // Limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCircuitFilter('all');
        setZonalFilter('all');
        setVendorFilter('all');
        setDateFrom(new Date().toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        router.get(route('mapas.tracking.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
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

    // Debounce para búsqueda
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, handleFilterChange]);

    // Auto-refresh
    useEffect(() => {
        if (isAutoRefresh) {
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
    }, [isAutoRefresh]);

    // Usuarios filtrados y ordenados
    const filteredUsers = useMemo(() => {
        return users.data.sort((a, b) => {
            const aStats = userStats[a.id];
            const bStats = userStats[b.id];
            if (!aStats || !bStats) return 0;
            return bStats.compliance_percentage - aStats.compliance_percentage;
        });
    }, [users.data, userStats]);

    return (
        <>
            <Head title="Sistema de Rastreo Avanzado" />

            <div className="h-screen flex flex-col bg-gray-50">
                {/* Header con estadísticas */}
                <TrackingHeader
                    stats={stats}
                    isAutoRefresh={isAutoRefresh}
                    showFilters={showFilters}
                    lastUpdate={lastUpdate}
                    onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                />

                {/* Panel de filtros */}
                {showFilters && (
                    <TrackingFilters
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        circuitFilter={circuitFilter}
                        zonalFilter={zonalFilter}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        vendorFilter={vendorFilter}
                        circuits={circuits}
                        zonales={zonales}
                        users={users.data}
                        onSearchChange={setSearchTerm}
                        onStatusChange={setStatusFilter}
                        onCircuitChange={setCircuitFilter}
                        onZonalChange={setZonalFilter}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                        onVendorChange={setVendorFilter}
                        onClearFilters={clearFilters}
                    />
                )}

                {/* Contenido principal con 3 paneles */}
                <div className="flex-1 flex overflow-hidden">
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

                    {/* Panel central - Mapa */}
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
                </div>

                {/* Botón flotante para mostrar panel de detalles */}
                {selectedUser && !showUserDetails && (
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
