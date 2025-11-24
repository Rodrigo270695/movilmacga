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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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
        if (!Auth::check() || !Auth::user()->can('mapa-rastreo-vendedores-acceso')) {
            abort(403, 'No tienes permisos para acceder al rastreo de vendedores.');
        }

        // Obtener filtros avanzados
        $filters = $request->only(['search', 'status', 'circuit', 'zonal', 'business', 'date_from', 'date_to', 'vendor']);
        $search = $filters['search'] ?? '';
        $statusFilter = $filters['status'] ?? 'all';
        $circuitFilter = $filters['circuit'] ?? 'all';
        $zonalFilter = $filters['zonal'] ?? 'all';
        $businessFilter = $filters['business'] ?? 'all';
        $dateFrom = $filters['date_from'] ?? now()->toDateString();
        $dateTo = $filters['date_to'] ?? now()->toDateString();
        $vendorFilter = $filters['vendor'] ?? 'all';

        $user = Auth::user();

        // Query para usuarios con rol de vendedor/supervisor que tienen sesiones activas
        $query = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['Supervisor', 'Vendedor']);
        })
        ->where('status', true)
        ->with([
            'activeWorkingSessions.gpsTracking' => function ($q) {
                $q->latest('recorded_at')->limit(1);
            },
            'activeUserCircuits.circuit.zonal.business',
            'roles'
        ]);

        // FILTROS JERÁRQUICOS INTEGRADOS

                // Filtro por empresa (si se seleccionó)
        if ($businessFilter !== 'all') {
            $query->whereHas('activeUserCircuits.circuit.zonal.business', function ($q) use ($businessFilter) {
                $q->where('name', $businessFilter);
            });
        }

        // Filtro por zonal (si se seleccionó)
        if ($zonalFilter !== 'all') {
            $query->whereHas('activeUserCircuits.circuit.zonal', function ($q) use ($zonalFilter) {
                $q->where('id', $zonalFilter);
            });
        }

        // Filtro por circuito (si se seleccionó)
        if ($circuitFilter !== 'all') {
            $query->whereHas('activeUserCircuits.circuit', function ($q) use ($circuitFilter) {
                $q->where('id', $circuitFilter);
            });
        }

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

        // Filtrar por búsqueda de vendedor específico
        if ($vendorFilter !== 'all') {
            $query->where('id', $vendorFilter);
        }

        // Filtrar por estado de conexión
        if ($statusFilter !== 'all') {
            if ($statusFilter === 'online') {
                $query->whereHas('activeWorkingSessions');
            } elseif ($statusFilter === 'offline') {
                $query->whereDoesntHave('activeWorkingSessions');
            }
        }

        $users = $query->orderBy('first_name')->paginate(20);

        // Log de depuración para filtros
        \Log::info('TrackingController index - Resultados', [
            'total_users_found' => $users->total(),
            'filters_applied' => [
                'business' => $businessFilter,
                'zonal' => $zonalFilter,
                'circuit' => $circuitFilter,
                'status' => $statusFilter
            ],
            'users_with_business' => $users->map(function($user) {
                return [
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'circuits' => $user->activeUserCircuits->map(function($uc) {
                        return [
                            'circuit' => $uc->circuit->name,
                            'zonal' => $uc->circuit->zonal->name,
                            'business' => $uc->circuit->zonal->business ? $uc->circuit->zonal->business->name : 'SIN EMPRESA'
                        ];
                    })
                ];
            })
        ]);

        // OPTIMIZACIÓN: Usar caché para opciones de filtros (TTL: 5 minutos)
        $cacheKey = 'tracking_filter_options_' . ($user->hasRole('Supervisor') ? 'supervisor_' . $user->id : 'admin');
        $filterOptions = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
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

            return [
                'circuits' => $circuitsQuery->get(['id', 'name', 'code', 'zonal_id']),
                'zonales' => $zonalesQuery->get(['id', 'name', 'business_id']),
            ];
        });

        $circuits = $filterOptions['circuits'];
        $zonales = $filterOptions['zonales'];

        // OPTIMIZACIÓN: Pre-cargar todas las estadísticas en lugar de hacerlo por usuario
        $userStats = $this->getBulkUserStats($users->pluck('id'), $dateFrom, $dateTo);

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
        if (!Auth::check() || !Auth::user()->can('mapa-rastreo-vendedores-tiempo-real')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        // Obtener filtros
        $filters = $request->only(['search', 'status', 'circuit', 'zonal', 'business', 'date_from', 'vendor']);
        $dateFilter = $filters['date_from'] ?? Carbon::today()->toDateString();
        $businessFilter = $filters['business'] ?? 'all';
        $zonalFilter = $filters['zonal'] ?? 'all';
        $circuitFilter = $filters['circuit'] ?? 'all';
        $vendorFilter = $filters['vendor'] ?? 'all';
        $statusFilter = $filters['status'] ?? 'all';

        $startOfDay = Carbon::parse($dateFilter)->startOfDay();
        $endOfDay = Carbon::parse($dateFilter)->endOfDay();

        // Log temporal para debugging
        \Log::info('TrackingController getRealTimeLocations', [
            'filters' => $filters,
            'date_filter' => $dateFilter,
            'start_of_day' => $startOfDay,
            'end_of_day' => $endOfDay
        ]);

        $user = Auth::user();

        // Query base para ubicaciones GPS con filtros aplicados
        $query = GpsTracking::with([
            'user:id,first_name,last_name,email',
            'user.activeWorkingSessions:id,user_id,started_at',
            'user.activeUserCircuits.circuit.zonal.business'
        ])
        ->select([
            'id', 'user_id', 'latitude', 'longitude', 'accuracy', 'speed',
            'heading', 'battery_level', 'is_mock_location', 'recorded_at'
        ])
        ->validLocation() // Filtrar ubicaciones con coordenadas válidas
        ->whereBetween('recorded_at', [$startOfDay, $endOfDay]);

        // APLICAR FILTROS JERÁRQUICOS A LAS UBICACIONES

        // Filtro por empresa
        if ($businessFilter !== 'all') {
            $query->whereHas('user.activeUserCircuits.circuit.zonal.business', function ($q) use ($businessFilter) {
                $q->where('name', $businessFilter);
            });
        }

        // Filtro por zonal
        if ($zonalFilter !== 'all') {
            $query->whereHas('user.activeUserCircuits.circuit.zonal', function ($q) use ($zonalFilter) {
                $q->where('id', $zonalFilter);
            });
        }

        // Filtro por circuito
        if ($circuitFilter !== 'all') {
            $query->whereHas('user.activeUserCircuits.circuit', function ($q) use ($circuitFilter) {
                $q->where('id', $circuitFilter);
            });
        }

        // Filtro por vendedor específico
        if ($vendorFilter !== 'all') {
            $query->where('user_id', $vendorFilter);
        }

        // Filtro por estado (online/offline)
        if ($statusFilter !== 'all') {
            if ($statusFilter === 'online') {
                $query->whereHas('user.activeWorkingSessions');
            } elseif ($statusFilter === 'offline') {
                $query->whereDoesntHave('user.activeWorkingSessions');
            }
        }

        // Si el usuario es Supervisor, limitar a su zonal
        if ($user->hasRole('Supervisor')) {
            $supervisorZonals = $user->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            if ($supervisorZonals->isNotEmpty()) {
                $query->whereHas('user.activeUserCircuits.circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
            } else {
                // Si el supervisor no tiene zonales asignados, no ve ubicaciones
                $query->whereRaw('1 = 0');
            }
        }

        // OPTIMIZACIÓN: Obtener solo la ubicación más reciente por usuario usando JOIN en lugar de subquery correlacionado
        // Primero obtenemos el MAX(recorded_at) por usuario en una subconsulta derivada
        $latestLocationsSubquery = DB::table('gps_tracking as g2')
            ->select('g2.user_id', DB::raw('MAX(g2.recorded_at) as max_recorded_at'))
            ->whereNotNull('g2.latitude')
            ->whereNotNull('g2.longitude')
            ->where('g2.is_mock_location', false)
            ->whereBetween('g2.recorded_at', [$startOfDay, $endOfDay])
            ->groupBy('g2.user_id');

        // Ahora hacemos JOIN con la subconsulta para obtener solo las ubicaciones más recientes
        $locations = $query
            ->joinSub($latestLocationsSubquery, 'latest', function ($join) {
                $join->on('gps_tracking.user_id', '=', 'latest.user_id')
                     ->on('gps_tracking.recorded_at', '=', 'latest.max_recorded_at');
            })
            ->get();

        // Log del resultado
        \Log::info('TrackingController getRealTimeLocations - Result', [
            'locations_count' => $locations->count(),
            'locations_data' => $locations->toArray()
        ]);

        return response()->json([
            'locations' => $locations,
            'date_filter' => $dateFilter,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Obtener historial de ubicaciones de un usuario
     */
    public function getUserLocationHistory(Request $request, User $user)
    {
        // Verificar permisos
        if (!Auth::check() || !Auth::user()->can('mapa-rastreo-vendedores-historial')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        $locations = GpsTracking::where('user_id', $user->id)
            ->validLocation() // Filtrar ubicaciones con coordenadas válidas
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
     * Obtener PDVs filtrados para mostrar en el mapa
     */
    public function getFilteredPdvs(Request $request)
    {
        // Verificar permisos
        if (!Auth::check() || !Auth::user()->can('mapa-rastreo-vendedores-ver')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        // Obtener filtros
        $filters = $request->only(['search', 'circuit', 'zonal', 'business', 'status', 'classification']);
        $search = $filters['search'] ?? '';
        $circuitFilter = $filters['circuit'] ?? 'all';
        $zonalFilter = $filters['zonal'] ?? 'all';
        $businessFilter = $filters['business'] ?? 'all';
        $statusFilter = $filters['status'] ?? 'all';
        $classificationFilter = $filters['classification'] ?? 'all';

        $user = Auth::user();

        // Query base para PDVs con coordenadas válidas
        $query = Pdv::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->with([
                'route.circuit.zonal.business',
                'locality.distrito.provincia.departamento'
            ]);

        // Si el usuario es Supervisor, solo ver PDVs de SU zonal
        if ($user->hasRole('Supervisor')) {
            $supervisorZonals = $user->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            if ($supervisorZonals->isNotEmpty()) {
                $query->whereHas('route.circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                });
            } else {
                // Si el supervisor no tiene zonales asignados, no ve ningún PDV
                $query->whereRaw('1 = 0');
            }
        }

        // Filtrar por búsqueda
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('point_name', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('pos_id', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

                // Filtrar por negocio
        if ($businessFilter !== 'all') {
            $query->whereHas('route.circuit.zonal.business', function ($q) use ($businessFilter) {
                $q->where('name', $businessFilter); // Filtrar por nombre, no por ID
            });
        }

        // Filtrar por zonal
        if ($zonalFilter !== 'all') {
            $query->whereHas('route.circuit.zonal', function ($q) use ($zonalFilter) {
                $q->where('id', $zonalFilter);
            });
        }

        // Filtrar por circuito
        if ($circuitFilter !== 'all') {
            $query->whereHas('route.circuit', function ($q) use ($circuitFilter) {
                $q->where('id', $circuitFilter);
            });
        }

        // Filtrar por estado del PDV
        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Filtrar por clasificación
        if ($classificationFilter !== 'all') {
            $query->where('classification', $classificationFilter);
        }

        $pdvs = $query->orderBy('point_name')->get();

        // Asegurar que las coordenadas sean números
        $pdvs = $pdvs->map(function ($pdv) {
            $pdv->latitude = (float) $pdv->latitude;
            $pdv->longitude = (float) $pdv->longitude;
            return $pdv;
        });

        return response()->json([
            'pdvs' => $pdvs,
            'filters' => $filters,
            'count' => $pdvs->count(),
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Obtener visitas de PDV de un usuario específico con filtros
     */
    public function getUserPdvVisits(Request $request, User $user)
    {
        // Verificar permisos
        if (!Auth::check() || !Auth::user()->can('mapa-rastreo-vendedores-ver')) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        // Obtener filtros
        $dateFrom = $request->get('date_from', now()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $authUser = Auth::user();

        // Si es supervisor, verificar que pueda ver este usuario
        if ($authUser->hasRole('Supervisor')) {
            $supervisorZonals = $authUser->activeZonalSupervisorAssignments()->with('zonal')->get()->pluck('zonal.id');

            // Verificar que el usuario esté en un zonal que supervisa
            $userInSupervisedZonal = $user->activeUserCircuits()
                ->whereHas('circuit.zonal', function ($q) use ($supervisorZonals) {
                    $q->whereIn('id', $supervisorZonals);
                })->exists();

            if (!$userInSupervisedZonal) {
                return response()->json(['error' => 'Sin permisos para ver este usuario'], 403);
            }
        }

        // Obtener visitas de PDV con relaciones
        $pdvVisits = $user->pdvVisits()
            ->with([
                'pdv' => function ($query) {
                    $query->select('id', 'point_name', 'client_name', 'pos_id', 'address', 'latitude', 'longitude', 'classification', 'status');
                },
                'pdv.route.circuit.zonal.business'
            ])
            ->whereBetween('check_in_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->orderBy('check_in_at', 'desc')
            ->get();

        // Formatear los datos
        $formattedVisits = $pdvVisits->map(function ($visit) {
            return [
                'id' => $visit->id,
                'check_in_at' => $visit->check_in_at?->format('Y-m-d H:i:s'),
                'check_out_at' => $visit->check_out_at?->format('Y-m-d H:i:s'),
                'duration_minutes' => $visit->duration_minutes,
                'duration_formatted' => $visit->duration_formatted,
                'visit_status' => $visit->visit_status,
                'visit_status_label' => $visit->visit_status_label,
                'is_valid' => $visit->is_valid,
                'distance_to_pdv' => $visit->distance_to_pdv,
                'visit_photo' => $visit->visit_photo,
                'notes' => $visit->notes,
                'visit_data' => $visit->visit_data,
                'coordinates' => $visit->coordinates,
                'pdv' => [
                    'id' => $visit->pdv->id,
                    'point_name' => $visit->pdv->point_name,
                    'client_name' => $visit->pdv->client_name,
                    'pos_id' => $visit->pdv->pos_id,
                    'address' => $visit->pdv->address,
                    'latitude' => $visit->pdv->latitude,
                    'longitude' => $visit->pdv->longitude,
                    'classification' => $visit->pdv->classification,
                    'status' => $visit->pdv->status,
                    'route' => $visit->pdv->route ? [
                        'id' => $visit->pdv->route->id,
                        'name' => $visit->pdv->route->name,
                        'code' => $visit->pdv->route->code,
                        'circuit' => $visit->pdv->route->circuit ? [
                            'id' => $visit->pdv->route->circuit->id,
                            'name' => $visit->pdv->route->circuit->name,
                            'code' => $visit->pdv->route->circuit->code,
                            'zonal' => $visit->pdv->route->circuit->zonal ? [
                                'id' => $visit->pdv->route->circuit->zonal->id,
                                'name' => $visit->pdv->route->circuit->zonal->name,
                                'business' => $visit->pdv->route->circuit->zonal->business ? [
                                    'id' => $visit->pdv->route->circuit->zonal->business->id,
                                    'name' => $visit->pdv->route->circuit->zonal->business->name,
                                ] : null
                            ] : null
                        ] : null
                    ] : null
                ]
            ];
        });

        // Calcular estadísticas con logs de debug
        $totalVisits = $formattedVisits->count();
        $completedVisits = $formattedVisits->where('visit_status', 'completed')->count();
        $inProgressVisits = $formattedVisits->where('visit_status', 'in_progress')->count();

        // Log de debug para ver los estados reales
        \Log::info('PDV Visits Debug Stats', [
            'user_id' => $user->id,
            'date_range' => [$dateFrom, $dateTo],
            'total_visits' => $totalVisits,
            'completed_visits' => $completedVisits,
            'in_progress_visits' => $inProgressVisits,
            'raw_visits_statuses' => $formattedVisits->pluck('visit_status')->toArray(),
            'raw_pdv_visits_count' => $pdvVisits->count(),
            'raw_pdv_visits_statuses' => $pdvVisits->pluck('visit_status')->toArray()
        ]);

        return response()->json([
            'pdv_visits' => $formattedVisits,
            'user_id' => $user->id,
            'date_range' => [
                'from' => $dateFrom,
                'to' => $dateTo
            ],
            'total_visits' => $totalVisits,
            'completed_visits' => $completedVisits,
            'in_progress_visits' => $inProgressVisits,
            'timestamp' => now()->toISOString()
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
            ->with(['route.circuit.zonal'])
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
     * OPTIMIZACIÓN: Obtener estadísticas de múltiples usuarios en una sola query
     */
    private function getBulkUserStats($userIds, string $dateFrom, string $dateTo)
    {
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        // Pre-cargar todas las sesiones de todos los usuarios
        $sessions = WorkingSession::whereIn('user_id', $userIds)
            ->whereBetween('started_at', [$startDate, $endDate])
            ->get()
            ->groupBy('user_id');

        // Pre-cargar todas las visitas PDV de todos los usuarios
        $pdvVisits = \App\Models\PdvVisit::whereIn('user_id', $userIds)
            ->whereBetween('check_in_at', [$startDate, $endDate])
            ->with('pdv:id,point_name')
            ->get()
            ->groupBy('user_id');

        // Pre-cargar circuitos asignados y PDVs programados
        $userCircuits = DB::table('user_circuits')
            ->whereIn('user_id', $userIds)
            ->where('is_active', true)
            ->join('circuits', 'user_circuits.circuit_id', '=', 'circuits.id')
            ->join('routes', 'circuits.id', '=', 'routes.circuit_id')
            ->join('pdvs', 'routes.id', '=', 'pdvs.route_id')
            ->selectRaw('user_circuits.user_id, COUNT(DISTINCT pdvs.id) as programmed_pdvs')
            ->groupBy('user_circuits.user_id')
            ->pluck('programmed_pdvs', 'user_id');

        $userStats = [];
        foreach ($userIds as $userId) {
            $userSessions = $sessions->get($userId, collect());
            $userVisits = $pdvVisits->get($userId, collect());

            $totalWorkingHours = $userSessions->sum(function ($session) {
                $end = $session->ended_at ?? now();
                return $session->started_at->diffInHours($end);
            });

            $userStats[$userId] = [
                'total_sessions' => $userSessions->count(),
                'working_hours' => round($totalWorkingHours, 1),
                'distance_traveled' => round($userSessions->sum('total_distance_km') ?? 0, 2),
                'pdv_visits' => $userVisits->count(),
                'programmed_pdvs' => $userCircuits[$userId] ?? 0,
                'compliance_percentage' => ($userCircuits[$userId] ?? 0) > 0 
                    ? round(($userVisits->count() / ($userCircuits[$userId] ?? 1)) * 100, 1) 
                    : 0,
            ];
        }

        return $userStats;
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

        // Obtener PDVs programados reales basados en los circuitos asignados al vendedor
        $programmedPdvs = 0;
        $vendorCircuits = $user->activeUserCircuits()->with('circuit')->get();

        if ($vendorCircuits->isNotEmpty()) {
            // Obtener todos los IDs de circuitos del vendedor
            $circuitIds = $vendorCircuits->pluck('circuit_id')->toArray();

            // Contar PDVs en todas las rutas de estos circuitos
            $programmedPdvs = Pdv::whereHas('route', function ($query) use ($circuitIds) {
                $query->whereIn('circuit_id', $circuitIds);
            })->count();
        }

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
            ->validLocation() // Filtrar ubicaciones con coordenadas válidas
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
