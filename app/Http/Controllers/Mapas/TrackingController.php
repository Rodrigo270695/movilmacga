<?php

namespace App\Http\Controllers\Mapas;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\GpsTracking;
use App\Models\WorkingSession;
use App\Models\Circuit;
use App\Models\Pdv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class TrackingController extends Controller
{
    /**
     * Mostrar el dashboard principal de tracking GPS
     */
    public function index(Request $request): Response
    {
        // Verificar permisos
        if (!auth()->user()->can('mapa-rastreo-vendedores-acceso')) {
            abort(403, 'No tienes permisos para acceder al rastreo de vendedores.');
        }

        // Obtener filtros avanzados
        $filters = $request->only(['search', 'status', 'circuit', 'zonal', 'date_from', 'date_to', 'vendor']);
        $search = $filters['search'] ?? '';
        $statusFilter = $filters['status'] ?? 'all';
        $circuitFilter = $filters['circuit'] ?? 'all';
        $zonalFilter = $filters['zonal'] ?? 'all';
        $dateFrom = $filters['date_from'] ?? now()->toDateString();
        $dateTo = $filters['date_to'] ?? now()->toDateString();
        $vendorFilter = $filters['vendor'] ?? 'all';

        $user = auth()->user();

        // Query para usuarios con rol de vendedor/supervisor que tienen sesiones activas
        $query = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['Supervisor', 'Vendedor']);
        })
        ->where('status', true)
        ->with([
            'activeWorkingSessions.gpsTracking' => function ($q) {
                $q->latest('recorded_at')->limit(1);
            },
            'activeUserCircuits.circuit.zonal',
            'roles'
        ]);

        // Si el usuario es Supervisor, solo ver vendedores de SU zonal
        if ($user->hasRole('Supervisor')) {
            $supervisorZonals = $user->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            if ($supervisorZonals->isNotEmpty()) {
                $query->whereHas('activeUserCircuits.circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
            } else {
                // Si el supervisor no tiene zonales asignados, no ve ningún vendedor
                $query->whereRaw('1 = 0');
            }
        }

        // Filtrar por búsqueda
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtrar por estado de conexión
        if ($statusFilter !== 'all') {
            if ($statusFilter === 'online') {
                $query->whereHas('activeWorkingSessions');
            } elseif ($statusFilter === 'offline') {
                $query->whereDoesntHave('activeWorkingSessions');
            }
        }

        // Filtrar por circuito
        if ($circuitFilter !== 'all') {
            $query->whereHas('activeUserCircuits', function ($q) use ($circuitFilter) {
                $q->where('circuit_id', $circuitFilter);
            });
        }

        // Filtrar por zonal
        if ($zonalFilter !== 'all') {
            $query->whereHas('activeUserCircuits.circuit.zonal', function ($q) use ($zonalFilter) {
                $q->where('id', $zonalFilter);
            });
        }

        // Filtrar por vendedor específico
        if ($vendorFilter !== 'all') {
            $query->where('id', $vendorFilter);
        }

        $users = $query->orderBy('first_name')->paginate(20);

        // Obtener circuitos y zonales para filtros (limitados por rol)
        $circuitsQuery = Circuit::with('zonal')->orderBy('name');
        $zonalesQuery = \App\Models\Zonal::with('business')->orderBy('name');

        // Si es supervisor, limitar a sus zonales
        if ($user->hasRole('Supervisor')) {
            $supervisorZonals = $user->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            if ($supervisorZonals->isNotEmpty()) {
                $circuitsQuery->whereHas('zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
                $zonalesQuery->whereIn('id', $supervisorZonals);
            }
        }

        $circuits = $circuitsQuery->get(['id', 'name', 'code', 'zonal_id']);
        $zonales = $zonalesQuery->get(['id', 'name', 'business_id']);

        // Obtener estadísticas detalladas por usuario
        $userStats = [];
        foreach ($users as $user) {
            $userStats[$user->id] = $this->getUserDetailedStats($user, $dateFrom, $dateTo);
        }

        // Estadísticas para el header (también limitadas por rol)
        $totalUsersQuery = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['Supervisor', 'Vendedor']);
        })->where('status', true);

        $onlineUsersQuery = User::whereHas('activeWorkingSessions');

        // Si es supervisor, limitar estadísticas a su zonal
        if ($user->hasRole('Supervisor')) {
            $supervisorZonals = $user->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            if ($supervisorZonals->isNotEmpty()) {
                $totalUsersQuery->whereHas('activeUserCircuits.circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
                $onlineUsersQuery->whereHas('activeUserCircuits.circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
            }
        }

        $stats = [
            'total_users' => $totalUsersQuery->count(),
            'online_users' => $onlineUsersQuery->count(),
            'active_sessions' => WorkingSession::where('ended_at', null)->count(),
            'total_circuits' => $circuits->count(),
        ];

        return Inertia::render('mapas/tracking/index', [
            'users' => $users,
            'circuits' => $circuits,
            'zonales' => $zonales,
            'userStats' => $userStats,
            'stats' => $stats,
            'filters' => $filters
        ]);
    }

    /**
     * Obtener ubicaciones en tiempo real (AJAX)
     */
    public function getRealTimeLocations(Request $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('mapa-rastreo-vendedores-tiempo-real')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        // Obtener ubicaciones de los últimos 5 minutos
        $locations = GpsTracking::with([
            'user:id,first_name,last_name,email',
            'user.activeWorkingSessions:id,user_id,started_at',
            'user.activeUserCircuits.circuit:id,name,code'
        ])
        ->where('recorded_at', '>=', Carbon::now()->subMinutes(5))
        ->whereHas('user.activeWorkingSessions')
        ->latest('recorded_at')
        ->get()
        ->groupBy('user_id')
        ->map(function ($userLocations) {
            return $userLocations->first(); // Solo la ubicación más reciente por usuario
        })
        ->values();

        return response()->json([
            'locations' => $locations,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Obtener historial de ubicaciones de un usuario
     */
    public function getUserLocationHistory(Request $request, User $user)
    {
        // Verificar permisos
        if (!auth()->user()->can('mapa-rastreo-vendedores-historial')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        $locations = GpsTracking::where('user_id', $user->id)
            ->whereBetween('recorded_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])
            ->orderBy('recorded_at')
            ->get();

        return response()->json([
            'user' => $user->only(['id', 'first_name', 'last_name', 'email']),
            'locations' => $locations,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }

    /**
     * Obtener PDVs cercanos a una ubicación
     */
    public function getNearbyPdvs(Request $request)
    {
        $latitude = $request->get('latitude');
        $longitude = $request->get('longitude');
        $radius = $request->get('radius', 1); // 1 km por defecto

        if (!$latitude || !$longitude) {
            return response()->json(['error' => 'Coordenadas requeridas'], 400);
        }

        // Usar la fórmula Haversine para encontrar PDVs cercanos
        $pdvs = Pdv::selectRaw("
                *,
                (
                    6371 * acos(
                        cos(radians(?)) *
                        cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) *
                        sin(radians(latitude))
                    )
                ) AS distance
            ", [$latitude, $longitude, $latitude])
            ->having('distance', '<', $radius)
            ->orderBy('distance')
            ->with(['route', 'circuit.zonal'])
            ->get();

        return response()->json([
            'pdvs' => $pdvs,
            'search_center' => [
                'latitude' => $latitude,
                'longitude' => $longitude
            ],
            'radius' => $radius
        ]);
    }

    /**
     * Obtener estadísticas de actividad de un usuario
     */
    public function getUserActivityStats(User $user, Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();

        // Estadísticas del día
        $stats = [
            'total_locations' => GpsTracking::where('user_id', $user->id)
                ->whereBetween('recorded_at', [$startOfDay, $endOfDay])
                ->count(),

            'distance_traveled' => $this->calculateDistanceTraveled($user->id, $startOfDay, $endOfDay),

            'working_time' => WorkingSession::where('user_id', $user->id)
                ->whereBetween('started_at', [$startOfDay, $endOfDay])
                ->get()
                ->sum(function ($session) {
                    $end = $session->ended_at ?? now();
                    return $session->started_at->diffInMinutes($end);
                }),

            'pdv_visits' => \App\Models\PdvVisit::where('user_id', $user->id)
                ->whereBetween('check_in_at', [$startOfDay, $endOfDay])
                ->count(),
        ];

        return response()->json([
            'user' => $user->only(['id', 'first_name', 'last_name', 'email']),
            'date' => $date,
            'stats' => $stats
        ]);
    }

    /**
     * Calcular distancia recorrida por un usuario en un periodo
     */
    private function calculateDistanceTraveled($userId, $startDate, $endDate)
    {
        $locations = GpsTracking::where('user_id', $userId)
            ->whereBetween('recorded_at', [$startDate, $endDate])
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude']);

        if ($locations->count() < 2) {
            return 0;
        }

        $totalDistance = 0;

        for ($i = 1; $i < $locations->count(); $i++) {
            $prev = $locations[$i - 1];
            $curr = $locations[$i];

            $totalDistance += $this->haversineDistance(
                $prev->latitude,
                $prev->longitude,
                $curr->latitude,
                $curr->longitude
            );
        }

        return round($totalDistance, 2);
    }

    /**
     * Calcular distancia entre dos puntos usando fórmula Haversine
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Radio de la Tierra en kilómetros

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Obtener estadísticas detalladas de un usuario para un período
     */
    private function getUserDetailedStats(User $user, string $dateFrom, string $dateTo)
    {
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        // Obtener sesiones del período
        $sessions = WorkingSession::where('user_id', $user->id)
            ->whereBetween('started_at', [$startDate, $endDate])
            ->with(['gpsTracking' => function ($q) {
                $q->orderBy('recorded_at');
            }])
            ->get();

        // Obtener visitas PDV del período
        $pdvVisits = \App\Models\PdvVisit::where('user_id', $user->id)
            ->whereBetween('check_in_at', [$startDate, $endDate])
            ->with('pdv')
            ->get();

        // Calcular estadísticas
        $totalSessions = $sessions->count();
        $totalWorkingHours = $sessions->sum(function ($session) {
            $end = $session->ended_at ?? now();
            return $session->started_at->diffInHours($end);
        });

        $totalDistance = 0;
        $allLocations = [];

        foreach ($sessions as $session) {
            if ($session->gpsTracking->count() > 1) {
                $sessionLocations = $session->gpsTracking->toArray();
                $allLocations = array_merge($allLocations, $sessionLocations);

                for ($i = 1; $i < count($sessionLocations); $i++) {
                    $prev = $sessionLocations[$i - 1];
                    $curr = $sessionLocations[$i];

                    $totalDistance += $this->haversineDistance(
                        $prev['latitude'],
                        $prev['longitude'],
                        $curr['latitude'],
                        $curr['longitude']
                    );
                }
            }
        }

        // Obtener PDVs programados (simulado - en producción sería desde una tabla de asignaciones)
        $programmedPdvs = 12; // Este valor debería venir de una tabla de asignaciones

        return [
            'total_sessions' => $totalSessions,
            'working_hours' => round($totalWorkingHours, 1),
            'distance_traveled' => round($totalDistance, 2),
            'pdv_visits' => $pdvVisits->count(),
            'programmed_pdvs' => $programmedPdvs,
            'compliance_percentage' => $programmedPdvs > 0 ? round(($pdvVisits->count() / $programmedPdvs) * 100, 1) : 0,
            'last_activity' => $allLocations ? Carbon::parse(end($allLocations)['recorded_at'])->diffForHumans() : 'Sin actividad',
            'route_coordinates' => $allLocations,
                        'pdv_visits_detail' => $pdvVisits->map(function ($visit) {
                return [
                    'pdv' => $visit->pdv->name ?? 'PDV Desconocido',
                    'visited_at' => Carbon::parse($visit->check_in_at)->format('H:i'),
                    'duration' => $visit->check_out_at ?
                        Carbon::parse($visit->check_in_at)->diffInMinutes(Carbon::parse($visit->check_out_at)) : $visit->duration_minutes
                ];
            })
        ];
    }

    /**
     * Obtener ruta detallada de un usuario para un día específico
     */
    public function getUserRouteForDate(Request $request, User $user)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();

        $locations = GpsTracking::where('user_id', $user->id)
            ->whereBetween('recorded_at', [$startOfDay, $endOfDay])
            ->orderBy('recorded_at')
            ->get();

        $pdvVisits = \App\Models\PdvVisit::where('user_id', $user->id)
            ->whereBetween('check_in_at', [$startOfDay, $endOfDay])
            ->with('pdv')
            ->get();

        return response()->json([
            'user' => $user->only(['id', 'first_name', 'last_name']),
            'date' => $date,
            'locations' => $locations,
            'pdv_visits' => $pdvVisits,
            'stats' => $this->getUserDetailedStats($user, $date, $date)
        ]);
    }
}
