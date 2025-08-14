<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Circuit;
use App\Models\Pdv;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserDataController extends Controller
{
    /**
     * Obtener circuitos asignados al vendedor con rutas filtradas por fecha de visita
     * NUEVA LÓGICA: Solo mostrar rutas que coincidan con la fecha actual (zona horaria Perú)
     */
    public function getUserCircuits(Request $request)
    {
        $user = $request->user();

        // Obtener fecha actual en zona horaria de Perú
        $peruDate = now()->setTimezone('America/Lima');
        $todayDate = $peruDate->format('Y-m-d');

        $circuits = $user->activeUserCircuits()
            ->with([
                'circuit.zonal:id,name',
                'circuit.routes' => function ($query) use ($todayDate) {
                    $query->where('status', true)
                          ->whereHas('visitDates', function ($subQuery) use ($todayDate) {
                              $subQuery->where('visit_date', $todayDate)
                                      ->where('is_active', true);
                          });
                }
            ])
            ->orderBy('priority')
            ->get()
            ->map(function ($assignment) {
                return [
                    'assignment_id' => $assignment->id,
                    'circuit' => [
                        'id' => $assignment->circuit->id,
                        'name' => $assignment->circuit->name,
                        'code' => $assignment->circuit->code,
                        'status' => $assignment->circuit->status,
                        'zonal_name' => $assignment->circuit->zonal->name,
                    ],
                    'routes_count' => $assignment->circuit->routes->count(),
                    'priority' => $assignment->priority,
                    'assigned_date' => $assignment->assigned_date,
                    'notes' => $assignment->notes,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'current_date' => $todayDate,
                'timezone' => 'America/Lima',
                'circuits_count' => $circuits->count(),
                'circuits' => $circuits
            ]
        ]);
    }

    /**
     * Obtener PDVs que debe visitar hoy
     * NUEVA LÓGICA: Basado en fechas específicas de visita (route_visit_dates)
     */
    public function getTodayPdvs(Request $request)
    {
        $user = $request->user();

        // Obtener fecha actual en zona horaria de Perú
        $peruDate = now()->setTimezone('America/Lima');
        $todayDate = $peruDate->format('Y-m-d');

        // Obtener rutas que tienen visitas programadas para hoy
        $routeIds = DB::table('route_visit_dates as rvd')
            ->join('routes as r', 'rvd.route_id', '=', 'r.id')
            ->join('user_circuits as uc', 'r.circuit_id', '=', 'uc.circuit_id')
            ->where('uc.user_id', $user->id)
            ->where('uc.is_active', true)
            ->where('rvd.visit_date', $todayDate)
            ->where('rvd.is_active', true)
            ->where('r.status', true)
            ->pluck('rvd.route_id');

        if ($routeIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'No tienes rutas programadas para visitar hoy',
                'data' => [
                    'date' => $todayDate,
                    'timezone' => 'America/Lima',
                    'routes_count' => 0,
                    'pdvs_count' => 0,
                    'pdvs' => []
                ]
            ]);
        }

        // Obtener PDVs de esas rutas
        $pdvs = Pdv::with([
            'route.circuit:id,name,code',
            'locality:id,name'
        ])
        ->whereIn('route_id', $routeIds)
        ->where('status', 'vende') // Solo PDVs que venden
        ->orderBy('route_id')
        ->get()
        ->map(function ($pdv) use ($user) {
            // Verificar si ya fue visitado hoy
            $visitedToday = $pdv->pdvVisits()
                ->where('user_id', $user->id)
                ->whereDate('check_in_at', today())
                ->where('is_valid', true)
                ->exists();

            return [
                'id' => $pdv->id,
                'point_name' => $pdv->point_name,
                'pos_id' => $pdv->pos_id,
                'client_name' => $pdv->client_name,
                'phone' => $pdv->phone,
                'classification' => $pdv->classification,
                'address' => $pdv->address,
                'reference' => $pdv->reference,
                'latitude' => (float) $pdv->latitude,
                'longitude' => (float) $pdv->longitude,
                'route' => [
                    'id' => $pdv->route->id,
                    'name' => $pdv->route->name,
                    'circuit_name' => $pdv->route->circuit->name,
                    'circuit_code' => $pdv->route->circuit->code,
                ],
                'locality' => [
                    'id' => $pdv->locality->id,
                    'name' => $pdv->locality->name,
                ],
                'visited_today' => $visitedToday,
                'sells_recharge' => $pdv->sells_recharge,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $todayDate,
                'timezone' => 'America/Lima',
                'routes_count' => $routeIds->count(),
                'pdvs_count' => $pdvs->count(),
                'visited_count' => $pdvs->where('visited_today', true)->count(),
                'pending_count' => $pdvs->where('visited_today', false)->count(),
                'pdvs' => $pdvs->values()
            ]
        ]);
    }

    /**
     * Obtener PDVs de un circuito específico
     */
    public function getPdvsByCircuit(Request $request, Circuit $circuit)
    {
        $user = $request->user();

        // Verificar que el usuario tenga asignado este circuito
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $circuit->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este circuito.',
            ], 403);
        }

        $pdvs = Pdv::with([
            'route:id,name,code',
            'locality:id,name'
        ])
        ->whereHas('route', function ($query) use ($circuit) {
            $query->where('circuit_id', $circuit->id)
                  ->where('status', true);
        })
        ->orderBy('route_id')
        ->get()
        ->map(function ($pdv) use ($user) {
            // Contar visitas del último mes
            $recentVisits = $pdv->pdvVisits()
                ->where('user_id', $user->id)
                ->where('check_in_at', '>=', now()->subMonth())
                ->where('is_valid', true)
                ->count();

            // Última visita
            $lastVisit = $pdv->pdvVisits()
                ->where('user_id', $user->id)
                ->where('is_valid', true)
                ->latest('check_in_at')
                ->first();

            return [
                'id' => $pdv->id,
                'point_name' => $pdv->point_name,
                'pos_id' => $pdv->pos_id,
                'client_name' => $pdv->client_name,
                'phone' => $pdv->phone,
                'classification' => $pdv->classification,
                'status' => $pdv->status,
                'address' => $pdv->address,
                'reference' => $pdv->reference,
                'latitude' => (float) $pdv->latitude,
                'longitude' => (float) $pdv->longitude,
                'route' => [
                    'id' => $pdv->route->id,
                    'name' => $pdv->route->name,
                ],
                'locality' => [
                    'id' => $pdv->locality->id,
                    'name' => $pdv->locality->name,
                ],
                'recent_visits_count' => $recentVisits,
                'last_visit_date' => $lastVisit?->check_in_at?->format('Y-m-d'),
                'sells_recharge' => $pdv->sells_recharge,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'circuit' => [
                    'id' => $circuit->id,
                    'name' => $circuit->name,
                    'code' => $circuit->code,
                ],
                'pdvs_count' => $pdvs->count(),
                'pdvs' => $pdvs
            ]
        ]);
    }

    /**
     * Obtener estadísticas del vendedor
     */
    public function getUserStats(Request $request)
    {
        $request->validate([
            'period' => 'nullable|string|in:today,week,month',
        ]);

        $user = $request->user();
        $period = $request->get('period', 'today');

        // Definir rango de fechas según el período
        switch ($period) {
            case 'week':
                $dateFrom = now()->startOfWeek();
                $dateTo = now()->endOfWeek();
                break;
            case 'month':
                $dateFrom = now()->startOfMonth();
                $dateTo = now()->endOfMonth();
                break;
            default: // today
                $dateFrom = today();
                $dateTo = today();
                break;
        }

        // Estadísticas de visitas
        $visitsQuery = $user->pdvVisits()
            ->whereDate('check_in_at', '>=', $dateFrom)
            ->whereDate('check_in_at', '<=', $dateTo);

        $totalVisits = $visitsQuery->count();
        $validVisits = $visitsQuery->where('is_valid', true)->count();
        $completedVisits = $visitsQuery->where('visit_status', 'completed')->count();
        $averageDuration = $visitsQuery->where('visit_status', 'completed')
            ->avg('duration_minutes');

        // Estadísticas de sesiones de trabajo
        $sessionsQuery = $user->workingSessions()
            ->whereDate('started_at', '>=', $dateFrom)
            ->whereDate('started_at', '<=', $dateTo);

        $totalSessions = $sessionsQuery->count();
        $completedSessions = $sessionsQuery->where('status', 'completed')->count();
        $totalWorkingMinutes = $sessionsQuery->where('status', 'completed')
            ->sum('total_duration_minutes');
        $totalDistance = $sessionsQuery->where('status', 'completed')
            ->sum('total_distance_km');

        // PDVs programados para el período
        $scheduledPdvsCount = 0;
        if ($period === 'today') {
            $today = now()->format('l');
            $circuitIds = DB::table('user_circuits as uc')
                ->join('circuit_frequencies as cf', 'uc.circuit_id', '=', 'cf.circuit_id')
                ->where('uc.user_id', $user->id)
                ->where('uc.is_active', true)
                ->where('cf.day_of_week', strtolower($today))
                ->pluck('uc.circuit_id');

            if ($circuitIds->isNotEmpty()) {
                $scheduledPdvsCount = Pdv::whereHas('route', function ($query) use ($circuitIds) {
                    $query->whereIn('circuit_id', $circuitIds)
                          ->where('status', true);
                })
                ->where('status', 'vende')
                ->count();
            }
        }

        // Calcular porcentaje de cumplimiento
        $compliancePercentage = $scheduledPdvsCount > 0 ?
            round(($validVisits / $scheduledPdvsCount) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'date_from' => $dateFrom->format('Y-m-d'),
                'date_to' => $dateTo->format('Y-m-d'),
                'visits' => [
                    'total' => $totalVisits,
                    'valid' => $validVisits,
                    'completed' => $completedVisits,
                    'scheduled' => $scheduledPdvsCount,
                    'compliance_percentage' => $compliancePercentage,
                    'average_duration_minutes' => $averageDuration ? round($averageDuration, 1) : 0,
                ],
                'working_sessions' => [
                    'total' => $totalSessions,
                    'completed' => $completedSessions,
                    'total_hours' => $totalWorkingMinutes ? round($totalWorkingMinutes / 60, 1) : 0,
                    'total_distance_km' => $totalDistance ? round($totalDistance, 1) : 0,
                ],
                'performance' => [
                    'visits_per_session' => $completedSessions > 0 ? round($validVisits / $completedSessions, 1) : 0,
                    'km_per_visit' => $validVisits > 0 && $totalDistance > 0 ? round($totalDistance / $validVisits, 1) : 0,
                ]
            ]
        ]);
    }

    /**
     * Obtener estadísticas generales (para dashboard)
     */
    public function getGeneralStats(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date',
        ]);

        $date = $request->get('date', today()->format('Y-m-d'));

        // Vendedores activos (con jornada iniciada)
        $activeVendors = User::role('Vendedor')
            ->whereHas('activeWorkingSessions')
            ->count();

        // Total de vendedores
        $totalVendors = User::role('Vendedor')
            ->where('status', true)
            ->count();

        // Visitas del día
        $todayVisits = DB::table('pdv_visits')
            ->whereDate('check_in_at', $date)
            ->count();

        $validVisits = DB::table('pdv_visits')
            ->whereDate('check_in_at', $date)
            ->where('is_valid', true)
            ->count();

        // Distancia total recorrida
        $totalDistance = DB::table('working_sessions')
            ->whereDate('started_at', $date)
            ->where('status', 'completed')
            ->sum('total_distance_km');

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'vendors' => [
                    'active' => $activeVendors,
                    'total' => $totalVendors,
                    'percentage_active' => $totalVendors > 0 ? round(($activeVendors / $totalVendors) * 100, 1) : 0,
                ],
                'visits' => [
                    'total' => $todayVisits,
                    'valid' => $validVisits,
                    'invalid' => $todayVisits - $validVisits,
                    'validity_percentage' => $todayVisits > 0 ? round(($validVisits / $todayVisits) * 100, 1) : 0,
                ],
                'distance' => [
                    'total_km' => $totalDistance ? round($totalDistance, 1) : 0,
                    'average_per_vendor' => $activeVendors > 0 && $totalDistance > 0 ?
                        round($totalDistance / $activeVendors, 1) : 0,
                ]
            ]
        ]);
    }

    /**
     * Obtener vendedores activos (para dashboard)
     */
    public function getActiveVendors(Request $request)
    {
        $activeVendors = User::with([
            'activeWorkingSessions:id,user_id,started_at,status',
            'activeUserCircuits.circuit:id,name,code'
        ])
        ->role('Vendedor')
        ->where('status', true)
        ->whereHas('activeWorkingSessions')
        ->get()
        ->map(function ($user) {
            $session = $user->activeWorkingSessions->first();
            $todayVisits = $user->pdvVisits()
                ->whereDate('check_in_at', today())
                ->where('is_valid', true)
                ->count();

            return [
                'user_id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'username' => $user->username,
                'circuits' => $user->activeUserCircuits->map(fn($assignment) => [
                    'name' => $assignment->circuit->name,
                    'code' => $assignment->circuit->code,
                ]),
                'session' => [
                    'started_at' => $session->started_at,
                    'duration_minutes' => now()->diffInMinutes($session->started_at),
                    'status' => $session->status,
                ],
                'today_visits' => $todayVisits,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'active_vendors_count' => $activeVendors->count(),
                'vendors' => $activeVendors
            ]
        ]);
    }

    /**
     * Obtener rutas con fechas de visita específicas para un circuito
     * NUEVO MÉTODO: Para mostrar rutas con sus fechas programadas
     */
    public function getCircuitRoutesWithDates(Request $request, Circuit $circuit)
    {
        $user = $request->user();

        // Verificar que el usuario tenga asignado este circuito
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $circuit->id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este circuito.',
            ], 403);
        }

        // Obtener fecha actual en zona horaria de Perú
        $peruDate = now()->setTimezone('America/Lima');
        $todayDate = $peruDate->format('Y-m-d');

        $routes = $circuit->routes()
            ->with(['visitDates' => function ($query) {
                $query->where('is_active', true)
                      ->orderBy('visit_date');
            }])
            ->where('status', true)
            ->get()
            ->map(function ($route) use ($todayDate) {
                $todayVisit = $route->visitDates
                    ->where('visit_date', $todayDate)
                    ->first();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'status' => $route->status,
                    'has_visit_today' => $todayVisit ? true : false,
                    'today_visit_date' => $todayVisit ? $todayVisit->visit_date : null,
                    'today_visit_notes' => $todayVisit ? $todayVisit->notes : null,
                    'all_visit_dates' => $route->visitDates->map(function ($visitDate) {
                        return [
                            'date' => $visitDate->visit_date,
                            'notes' => $visitDate->notes,
                            'is_active' => $visitDate->is_active,
                        ];
                    }),
                    'pdvs_count' => $route->pdvs()->where('status', 'vende')->count(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'circuit' => [
                    'id' => $circuit->id,
                    'name' => $circuit->name,
                    'code' => $circuit->code,
                ],
                'current_date' => $todayDate,
                'timezone' => 'America/Lima',
                'routes_count' => $routes->count(),
                'routes_with_visits_today' => $routes->where('has_visit_today', true)->count(),
                'routes' => $routes
            ]
        ]);
    }
}
