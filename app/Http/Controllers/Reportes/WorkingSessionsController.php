<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\WorkingSession;
use App\Models\User;
use App\Models\Circuit;
use App\Models\Business;
use App\Models\Zonal;
use App\Models\RouteVisitDate;
use App\Models\PdvVisit;
use App\Exports\WorkingSessionsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class WorkingSessionsController extends Controller
{
    /**
     * Mostrar el reporte de jornadas laborales
     */
    public function index(Request $request)
    {
        // Si no hay filtros de fecha, usar la fecha actual (Lima, Perú)
        $dateFrom = $request->date_from ?: now()->setTimezone('America/Lima')->format('Y-m-d');
        $dateTo = $request->date_to ?: now()->setTimezone('America/Lima')->format('Y-m-d');

        // Obtener el scope del usuario desde el middleware
        $businessScope = app('business.scope') ?? [
            'is_admin' => true,
            'business_id' => null,
            'business_ids' => [],
            'zonal_ids' => [],
            'has_business_restriction' => false,
            'has_zonal_restriction' => false
        ];

        $query = WorkingSession::with([
            'user:id,name,first_name,last_name,username',
            'user.userCircuits' => function ($query) {
                $query->where('is_active', true)
                      ->with('circuit:id,name,code,zonal_id');
            },
            'user.userCircuits.circuit.zonal:id,name'
        ]);

        // Filtros de fecha (siempre aplicar)
        $query->whereDate('started_at', '>=', $dateFrom);
        $query->whereDate('started_at', '<=', $dateTo);

        // Aplicar filtros automáticos basados en el scope del usuario
        if (!$businessScope['is_admin']) {
            // Si el usuario tiene restricción de negocio
            if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('business_id', $businessScope['business_ids']);
                });
            }

            // Si el usuario tiene restricción de zonal
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('zonales.id', $businessScope['zonal_ids']);
                });
            }
        }

        // Filtros jerárquicos
        if ($request->filled('business_id')) {
            // Filtrar por negocio a través de la relación zonal -> negocio
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->whereHas('business', function ($q2) use ($request) {
                    $q2->where('businesses.id', $request->business_id);
                });
            });
        }

        if ($request->filled('zonal_id')) {
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->where('zonales.id', $request->zonal_id);
            });
        }

        if ($request->filled('circuit_id')) {
            $query->whereHas('user.userCircuits', function ($q) use ($request) {
                $q->where('circuit_id', $request->circuit_id)
                  ->where('is_active', true);
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Ordenamiento
        $query->orderBy('started_at', 'desc');

        // Paginación
        $perPage = $request->get('per_page', 10);
        $sessions = $query->paginate($perPage)->withQueryString();

        // Transformar datos para el frontend
        $sessions->getCollection()->transform(function ($session) {
            $session->formatted_start_time = $session->started_at->format('H:i');
            $session->formatted_start_date = $session->started_at->format('d/m/Y');
            $session->formatted_end_time = $session->ended_at ? $session->ended_at->format('H:i') : null;
            $session->duration_formatted = $session->getDurationFormattedAttribute();
            $session->status_label = $session->getStatusLabelAttribute();

            // Obtener circuito activo del usuario
            $session->active_circuit = $session->user->userCircuits->first()?->circuit;

            // Obtener la ruta específica que le tocó en la fecha de la jornada
            $session->assigned_route = null;
            $session->route_pdvs_count = 0;
            $session->visited_pdvs_count = 0;

            if ($session->active_circuit) {
                $visitDate = $session->started_at->format('Y-m-d');
                $session->assigned_route = RouteVisitDate::where('visit_date', $visitDate)
                    ->where('is_active', true)
                    ->whereHas('route', function ($query) use ($session) {
                        $query->where('circuit_id', $session->active_circuit->id)
                              ->where('status', true);
                    })
                    ->with('route:id,name,code')
                    ->first()?->route;

                                // Obtener conteo de PDVs de la ruta y PDVs visitados
                if ($session->assigned_route) {
                    // Total de PDVs en la ruta con estado "vende"
                    $session->route_pdvs_count = $session->assigned_route->pdvs()->where('status', 'vende')->count();

                    // PDVs visitados en la fecha de la jornada (solo los que tienen check_out)
                    $session->visited_pdvs_count = PdvVisit::where('user_id', $session->user_id)
                        ->whereDate('check_out_at', $visitDate)
                        ->whereNotNull('check_out_at')
                        ->whereHas('pdv', function ($query) use ($session) {
                            $query->where('route_id', $session->assigned_route->id);
                        })
                        ->count();
                }
            }

            return $session;
        });

        // Datos para filtros jerárquicos (respetando el scope del usuario)
        $businessesQuery = Business::where('status', true);
        $zonalesQuery = Zonal::with('business:id,name')->where('status', true);
        $circuitsQuery = Circuit::with('zonal:id,name')->where('status', true);

        // Aplicar filtros automáticos basados en el scope del usuario
        if (!$businessScope['is_admin']) {
            // Si el usuario tiene restricción de negocio
            if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                $businessesQuery->whereIn('id', $businessScope['business_ids']);
                $zonalesQuery->whereIn('business_id', $businessScope['business_ids']);
                $circuitsQuery->whereHas('zonal', function ($q) use ($businessScope) {
                    $q->whereIn('business_id', $businessScope['business_ids']);
                });
            }

            // Si el usuario tiene restricción de zonal
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $zonalesQuery->whereIn('id', $businessScope['zonal_ids']);
                $circuitsQuery->whereIn('zonal_id', $businessScope['zonal_ids']);
            }
        }

        $businesses = $businessesQuery->orderBy('name')->get(['id', 'name']);
        $allZonales = $zonalesQuery->orderBy('name')->get(['id', 'name', 'business_id']);
        $allCircuits = $circuitsQuery->orderBy('name')->get(['id', 'name', 'code', 'zonal_id']);

        // Filtrar zonales y circuitos según los filtros aplicados
        $zonales = $allZonales;
        $circuits = $allCircuits;

        if ($request->filled('business_id')) {
            $zonales = $allZonales->where('business_id', $request->business_id);
        }

        if ($request->filled('zonal_id')) {
            $circuits = $allCircuits->where('zonal_id', $request->zonal_id);
        }

                        // Usuarios filtrados según la jerarquía seleccionada
        $usersQuery = User::role('Vendedor')->where('status', true);

        // Si no hay negocio seleccionado, no mostrar usuarios
        if (!$request->filled('business_id')) {
            $users = collect([]); // Lista vacía
        } else {
            // Si hay negocio seleccionado, filtrar por la jerarquía
            if ($request->filled('zonal_id')) {
                // Si hay zonal seleccionado, filtrar por zonal
                $usersQuery->whereHas('userCircuits.circuit.zonal', function ($q) use ($request) {
                    $q->where('zonales.id', $request->zonal_id);
                });

                if ($request->filled('circuit_id')) {
                    // Si hay circuito seleccionado, filtrar por circuito específico
                    $usersQuery->whereHas('userCircuits', function ($q) use ($request) {
                        $q->where('circuit_id', $request->circuit_id)
                          ->where('is_active', true);
                    });
                }
            } else {
                // Si no hay zonal seleccionado, mostrar todos los usuarios del negocio
                // (a través de la relación zonal -> negocio)
                $usersQuery->whereHas('userCircuits.circuit.zonal', function ($q) use ($request) {
                    $q->whereHas('business', function ($q2) use ($request) {
                        $q2->where('businesses.id', $request->business_id);
                    });
                });
            }

            $users = $usersQuery->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'name']);
        }

        // Opciones de estado (solo activo y completada)
        $statuses = [
            ['value' => 'active', 'label' => 'Activo'],
            ['value' => 'completed', 'label' => 'Completada'],
        ];

        // Estadísticas generales (usando las mismas fechas)
        $stats = $this->getStats($request, $dateFrom, $dateTo);

        return Inertia::render('reportes/jornadas-laborales/index', [
            'sessions' => $sessions,
            'filtros' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'business_id' => $request->business_id,
                'zonal_id' => $request->zonal_id,
                'circuit_id' => $request->circuit_id,
                'user_id' => $request->user_id,
                'status' => $request->status,
                'per_page' => $request->get('per_page', 10),
            ],
            'opciones' => [
                'businesses' => $businesses,
                'allZonales' => $allZonales,
                'allCircuits' => $allCircuits,
                'zonales' => $zonales,
                'circuits' => $circuits,
                'users' => $users,
                'statuses' => $statuses,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Obtener detalles de una jornada específica
     */
    public function show(WorkingSession $session)
    {
        $session->load([
            'user:id,name,first_name,last_name,username',
            'user.userCircuits' => function ($query) {
                $query->where('is_active', true)
                      ->with('circuit:id,name,code,zonal_id');
            },
            'user.userCircuits.circuit.zonal:id,name',
            'pdvVisits' => function ($query) {
                $query->with('pdv:id,point_name,client_name,latitude,longitude');
            },
            'gpsTracking' => function ($query) {
                $query->orderBy('recorded_at');
            }
        ]);

        // Obtener el primer punto GPS después del inicio
        $firstGpsPoint = $session->gpsTracking()
            ->where('recorded_at', '>=', $session->started_at)
            ->orderBy('recorded_at')
            ->first();

        return response()->json([
            'success' => true,
            'session' => [
                'id' => $session->id,
                'started_at' => $session->started_at->format('Y-m-d H:i:s'),
                'ended_at' => $session->ended_at?->format('Y-m-d H:i:s'),
                'status' => $session->status,
                'status_label' => $session->getStatusLabelAttribute(),
                'duration_formatted' => $session->getDurationFormattedAttribute(),
                'total_distance_km' => $session->total_distance_km,
                'total_pdvs_visited' => $session->total_pdvs_visited,
                'notes' => $session->notes,
                'start_coordinates' => $session->getStartCoordinatesAttribute(),
                'end_coordinates' => $session->getEndCoordinatesAttribute(),
                'user' => [
                    'id' => $session->user->id,
                    'name' => $session->user->name,
                    'username' => $session->user->username,
                ],
                'active_circuit' => $session->user->userCircuits->first()?->circuit,
                'first_gps_point' => $firstGpsPoint ? [
                    'latitude' => $firstGpsPoint->latitude,
                    'longitude' => $firstGpsPoint->longitude,
                    'recorded_at' => $firstGpsPoint->recorded_at->format('Y-m-d H:i:s'),
                    'accuracy' => $firstGpsPoint->accuracy,
                ] : null,
                'gps_tracking_count' => $session->gpsTracking()->count(),
                'pdv_visits_count' => $session->pdvVisits()->count(),
            ]
        ]);
    }

    /**
     * Obtener datos para el mapa de una jornada
     */
    public function getMapData(WorkingSession $session)
    {
        // Puntos GPS de la jornada
        $gpsPoints = $session->gpsTracking()
            ->where('recorded_at', '>=', $session->started_at)
            ->where('recorded_at', '<=', $session->ended_at ?? now())
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude', 'recorded_at', 'speed', 'accuracy']);

        // Visitas PDV de la jornada
        $pdvVisits = $session->pdvVisits()
            ->with('pdv:id,point_name,client_name,latitude,longitude')
            ->orderBy('check_in_at')
            ->get(['id', 'pdv_id', 'check_in_at', 'latitude', 'longitude', 'visit_status']);

        return response()->json([
            'success' => true,
            'map_data' => [
                'session_start' => [
                    'latitude' => $session->start_latitude,
                    'longitude' => $session->start_longitude,
                    'time' => $session->started_at->format('H:i'),
                    'date' => $session->started_at->format('d/m/Y'),
                ],
                'session_end' => $session->ended_at ? [
                    'latitude' => $session->end_latitude,
                    'longitude' => $session->end_longitude,
                    'time' => $session->ended_at->format('H:i'),
                    'date' => $session->ended_at->format('d/m/Y'),
                ] : null,
                'gps_track' => $gpsPoints->map(function ($point) {
                    return [
                        'latitude' => $point->latitude,
                        'longitude' => $point->longitude,
                        'recorded_at' => $point->recorded_at->format('H:i'),
                        'speed' => $point->speed,
                        'accuracy' => $point->accuracy,
                    ];
                }),
                'pdv_visits' => $pdvVisits->map(function ($visit) {
                    return [
                        'id' => $visit->id,
                        'pdv_name' => $visit->pdv->point_name,
                        'client_name' => $visit->pdv->client_name,
                        'latitude' => $visit->latitude,
                        'longitude' => $visit->longitude,
                        'check_in_at' => $visit->check_in_at->format('H:i'),
                        'visit_status' => $visit->visit_status,
                    ];
                }),
            ]
        ]);
    }

    /**
     * Exportar reporte de jornadas laborales
     */
    public function export(Request $request)
    {
        // Aplicar los mismos filtros que en el index
        $dateFrom = $request->date_from ?: now()->setTimezone('America/Lima')->format('Y-m-d');
        $dateTo = $request->date_to ?: now()->setTimezone('America/Lima')->format('Y-m-d');

        // Obtener el scope del usuario desde el middleware
        $businessScope = app('business.scope') ?? [
            'is_admin' => true,
            'business_id' => null,
            'business_ids' => [],
            'zonal_ids' => [],
            'has_business_restriction' => false,
            'has_zonal_restriction' => false
        ];

        $query = WorkingSession::with([
            'user:id,name,first_name,last_name,username',
            'user.userCircuits' => function ($query) {
                $query->where('is_active', true)
                      ->with('circuit:id,name,code,zonal_id');
            },
            'user.userCircuits.circuit.zonal:id,name'
        ]);

        // Date filters (always apply)
        $query->whereDate('started_at', '>=', $dateFrom);
        $query->whereDate('started_at', '<=', $dateTo);

        // Aplicar filtros automáticos basados en el scope del usuario
        if (!$businessScope['is_admin']) {
            // Si el usuario tiene restricción de negocio
            if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('business_id', $businessScope['business_ids']);
                });
            }

            // Si el usuario tiene restricción de zonal
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('zonales.id', $businessScope['zonal_ids']);
                });
            }
        }

        // Hierarchical filters
        if ($request->filled('business_id')) {
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->whereHas('business', function ($q2) use ($request) {
                    $q2->where('businesses.id', $request->business_id);
                });
            });
        }
        if ($request->filled('zonal_id')) {
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->where('zonales.id', $request->zonal_id);
            });
        }
        if ($request->filled('circuit_id')) {
            $query->whereHas('user.userCircuits', function ($q) use ($request) {
                $q->where('circuit_id', $request->circuit_id)
                  ->where('is_active', true);
            });
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Obtener todas las sesiones (sin paginación para exportar)
        $sessions = $query->orderBy('started_at', 'desc')->get();

        // Log para verificar filtros aplicados
        Log::info('Exportación de jornadas laborales', [
            'filtros_aplicados' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'business_id' => $request->business_id,
                'zonal_id' => $request->zonal_id,
                'circuit_id' => $request->circuit_id,
                'user_id' => $request->user_id,
                'status' => $request->status,
            ],
            'total_registros' => $sessions->count(),
            'sql_query' => $query->toSql(),
            'sql_bindings' => $query->getBindings(),
        ]);

        // Transformar datos para la exportación
        $sessions->transform(function ($session) {
            $session->formatted_start_time = $session->started_at->format('H:i');
            $session->formatted_start_date = $session->started_at->format('d/m/Y');
            $session->formatted_end_time = $session->ended_at ? $session->ended_at->format('H:i') : null;
            $session->duration_formatted = $session->getDurationFormattedAttribute();
            $session->status_label = $session->getStatusLabelAttribute();

            // Obtener circuito activo del usuario
            $session->active_circuit = $session->user->userCircuits->first()?->circuit;

            // Obtener la ruta específica que le tocó en la fecha de la jornada
            $session->assigned_route = null;
            $session->route_pdvs_count = 0;
            $session->visited_pdvs_count = 0;

            if ($session->active_circuit) {
                $visitDate = $session->started_at->format('Y-m-d');
                $session->assigned_route = RouteVisitDate::where('visit_date', $visitDate)
                    ->where('is_active', true)
                    ->whereHas('route', function ($query) use ($session) {
                        $query->where('circuit_id', $session->active_circuit->id)
                              ->where('status', true);
                    })
                    ->with('route:id,name,code')
                    ->first()?->route;

                // Obtener conteo de PDVs de la ruta y PDVs visitados
                if ($session->assigned_route) {
                    // Total de PDVs en la ruta con estado "vende"
                    $session->route_pdvs_count = $session->assigned_route->pdvs()->where('status', 'vende')->count();

                    // PDVs visitados en la fecha de la jornada (solo los que tienen check_out)
                    $session->visited_pdvs_count = PdvVisit::where('user_id', $session->user_id)
                        ->whereDate('check_out_at', $visitDate)
                        ->whereNotNull('check_out_at')
                        ->whereHas('pdv', function ($query) use ($session) {
                            $query->where('route_id', $session->assigned_route->id);
                        })
                        ->count();
                }
            }

            return $session;
        });

        // Generar nombre del archivo con información de filtros
        $fileName = $this->generateFileName($request, $sessions->count());

        // Exportar a Excel
        return Excel::download(
            new WorkingSessionsExport($sessions),
            $fileName
        );
    }

    /**
     * Obtener estadísticas del reporte
     */
    private function getStats(Request $request, $dateFrom, $dateTo)
    {
        // Obtener el scope del usuario desde el middleware
        $businessScope = app('business.scope') ?? [
            'is_admin' => true,
            'business_id' => null,
            'business_ids' => [],
            'zonal_ids' => [],
            'has_business_restriction' => false,
            'has_zonal_restriction' => false
        ];

        $query = WorkingSession::query();

        // Aplicar filtros de fecha (siempre)
        $query->whereDate('started_at', '>=', $dateFrom);
        $query->whereDate('started_at', '<=', $dateTo);

        // Aplicar filtros automáticos basados en el scope del usuario
        if (!$businessScope['is_admin']) {
            // Si el usuario tiene restricción de negocio
            if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('business_id', $businessScope['business_ids']);
                });
            }

            // Si el usuario tiene restricción de zonal
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
                    $q->whereIn('zonales.id', $businessScope['zonal_ids']);
                });
            }
        }

        // Filtros jerárquicos
        if ($request->filled('business_id')) {
            // Filtrar por negocio a través de la relación zonal -> negocio
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->whereHas('business', function ($q2) use ($request) {
                    $q2->where('businesses.id', $request->business_id);
                });
            });
        }

        if ($request->filled('zonal_id')) {
            $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($request) {
                $q->where('zonales.id', $request->zonal_id);
            });
        }

        if ($request->filled('circuit_id')) {
            $query->whereHas('user.userCircuits', function ($q) use ($request) {
                $q->where('circuit_id', $request->circuit_id)
                  ->where('is_active', true);
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $totalSessions = $query->count();
        $completedSessions = (clone $query)->where('status', 'completed')->count();
        $activeSessions = (clone $query)->where('status', 'active')->count();

        $avgDuration = (clone $query)
            ->whereNotNull('total_duration_minutes')
            ->avg('total_duration_minutes');

        // Contar PDVs visitados solo con estado 'vende'
        $sessionIds = $query->pluck('id');
        $totalPdvsVisited = PdvVisit::whereIn('user_id', $query->pluck('user_id'))
            ->whereHas('pdv', function ($q) {
                $q->where('status', 'vende');
            })
            ->whereNotNull('check_out_at')
            ->whereDate('check_in_at', '>=', $dateFrom)
            ->whereDate('check_in_at', '<=', $dateTo)
            ->count();

        $totalDistance = (clone $query)->sum('total_distance_km');

        return [
            'total_sessions' => $totalSessions,
            'completed_sessions' => $completedSessions,
            'active_sessions' => $activeSessions,
            'avg_duration_minutes' => round($avgDuration ?? 0),
            'avg_duration_formatted' => $avgDuration ? $this->formatDuration($avgDuration) : '0m',
            'total_pdvs_visited' => $totalPdvsVisited,
            'total_distance_km' => round($totalDistance ?? 0, 2),
        ];
    }

    /**
     * Obtener PDVs visitados para una ruta específica
     */
    public function getPdvVisits(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'visit_date' => 'required|string',
            'route_id' => 'required|integer'
        ]);

        try {
            $visits = PdvVisit::where('user_id', $request->user_id)
                ->whereDate('check_out_at', $request->visit_date)
                ->whereNotNull('check_out_at')
                ->whereHas('pdv', function ($query) use ($request) {
                    $query->where('route_id', $request->route_id);
                })
                ->with('pdv:id,point_name,client_name,address,latitude,longitude')
                ->get(['id', 'pdv_id', 'check_in_at', 'check_out_at']);

            return response()->json([
                'success' => true,
                'visits' => $visits
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener PDVs visitados: ' . $e->getMessage(),
                'visits' => []
            ], 500);
        }
    }

    /**
     * Obtener GPS tracking para una jornada laboral específica
     */
    public function getGpsTracking(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'date' => 'required|string',
            'working_session_id' => 'required|integer'
        ]);

        try {
            // Convertir fecha de yyyy-mm-dd a formato para consulta
            $date = Carbon::createFromFormat('Y-m-d', $request->date)->format('Y-m-d');

            // Obtener la jornada laboral para obtener el rango de tiempo
            $workingSession = WorkingSession::find($request->working_session_id);

            if (!$workingSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jornada laboral no encontrada'
                ], 404);
            }

            // Obtener puntos de GPS tracking para el usuario en el rango de tiempo de la jornada
            $trackingPoints = DB::table('gps_tracking')
                ->where('user_id', $request->user_id)
                ->whereBetween('recorded_at', [
                    $workingSession->started_at,
                    $workingSession->ended_at ?? now()
                ])
                ->whereDate('recorded_at', $date)
                ->orderBy('recorded_at', 'asc')
                ->get([
                    'id',
                    'latitude',
                    'longitude',
                    'accuracy',
                    'speed',
                    'heading',
                    'battery_level',
                    'is_mock_location',
                    'recorded_at'
                ]);

            return response()->json([
                'success' => true,
                'tracking' => $trackingPoints
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener GPS tracking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar nombre del archivo de exportación con información de filtros
     */
    private function generateFileName(Request $request, int $count): string
    {
        $parts = ['jornadas_laborales'];

        // Agregar información de fechas
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $parts[] = $request->date_from . '_a_' . $request->date_to;
        } elseif ($request->filled('date_from')) {
            $parts[] = 'desde_' . $request->date_from;
        } elseif ($request->filled('date_to')) {
            $parts[] = 'hasta_' . $request->date_to;
        } else {
            $parts[] = 'todas_fechas';
        }

        // Agregar información de filtros aplicados
        $filters = [];

        if ($request->filled('business_id')) {
            $business = Business::find($request->business_id);
            $filters[] = 'negocio_' . ($business ? str_replace(' ', '_', $business->name) : $request->business_id);
        }

        if ($request->filled('zonal_id')) {
            $zonal = Zonal::find($request->zonal_id);
            $filters[] = 'zonal_' . ($zonal ? str_replace(' ', '_', $zonal->name) : $request->zonal_id);
        }

        if ($request->filled('circuit_id')) {
            $circuit = Circuit::find($request->circuit_id);
            $filters[] = 'circuito_' . ($circuit ? str_replace(' ', '_', $circuit->name) : $request->circuit_id);
        }

        if ($request->filled('user_id')) {
            $user = User::find($request->user_id);
            $filters[] = 'vendedor_' . ($user ? str_replace(' ', '_', $user->name) : $request->user_id);
        }

        if ($request->filled('status')) {
            $filters[] = 'estado_' . $request->status;
        }

        if (!empty($filters)) {
            $parts[] = 'filtros_' . implode('_', $filters);
        }

        // Agregar contador de registros
        $parts[] = $count . '_registros';

        // Agregar timestamp
        $parts[] = now()->format('Y-m-d_H-i-s');

        return implode('_', $parts) . '.xlsx';
    }

    /**
     * Formatear duración en minutos a formato legible
     */
    private function formatDuration($minutes)
    {
        $hours = intval($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return "{$hours}h {$mins}m";
        }

        return "{$mins}m";
    }
}
