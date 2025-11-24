<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\PdvVisit;
use App\Models\User;
use App\Models\Pdv;
use App\Traits\HasBusinessScope;
use App\Exports\PdvVisitadosExport;
use App\Exports\PdvVisitadosWithFormResponsesExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class PdvVisitadosController extends Controller
{
    use HasBusinessScope;
    /**
     * Mostrar el reporte de PDVs visitados
     */
    public function index(Request $request)
    {
        // Aumentar timeout para consultas pesadas
        set_time_limit(120); // 2 minutos
        
        // Obtener filtros de la request con valores por defecto del día actual en Perú
        // CORREGIDO: Validar y limpiar valores de filtros, preservando valores originales para el frontend
        $fechaDesde = $request->get('fecha_desde', now()->format('Y-m-d'));
        $fechaHasta = $request->get('fecha_hasta', now()->format('Y-m-d'));
        
        // Preservar valores originales del request para devolver al frontend
        $vendedorIdRaw = $request->get('vendedor_id');
        $pdvIdRaw = $request->get('pdv_id');
        $estado = $request->get('estado');
        $mockLocation = $request->get('mock_location');
        $businessIdRaw = $request->get('business_id');
        $zonalIdRaw = $request->get('zonal_id');
        $circuitIdRaw = $request->get('circuit_id');
        $routeIdRaw = $request->get('route_id');
        
        // Validar que los IDs sean enteros válidos o 'todos' (para queries)
        $vendedorId = ($vendedorIdRaw && $vendedorIdRaw !== 'todos' && is_numeric($vendedorIdRaw)) ? (int)$vendedorIdRaw : null;
        $pdvId = ($pdvIdRaw && $pdvIdRaw !== 'todos' && is_numeric($pdvIdRaw)) ? (int)$pdvIdRaw : null;
        $businessId = ($businessIdRaw && $businessIdRaw !== 'todos' && is_numeric($businessIdRaw)) ? (int)$businessIdRaw : null;
        $zonalId = ($zonalIdRaw && $zonalIdRaw !== 'todos' && is_numeric($zonalIdRaw)) ? (int)$zonalIdRaw : null;
        $circuitId = ($circuitIdRaw && $circuitIdRaw !== 'todos' && is_numeric($circuitIdRaw)) ? (int)$circuitIdRaw : null;
        $routeId = ($routeIdRaw && $routeIdRaw !== 'todos' && is_numeric($routeIdRaw)) ? (int)$routeIdRaw : null;
        
        // Logging para debugging (solo en desarrollo o cuando hay filtros activos)
        if (config('app.debug') || $businessId || $zonalId || $circuitId || $routeId) {
            \Log::info('PdvVisitadosController::index - Filtros aplicados', [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'business_id' => $businessId,
                'zonal_id' => $zonalId,
                'circuit_id' => $circuitId,
                'route_id' => $routeId,
                'vendedor_id' => $vendedorId,
                'pdv_id' => $pdvId,
                'estado' => $estado,
            ]);
        }

        // OPTIMIZACIÓN CRÍTICA: Usar subquery para limitar IDs antes de JOINs y ORDER BY
        // Esto evita el error de memoria de MySQL al ordenar millones de registros
        // ESTRATEGIA: Obtener IDs sin ordenar primero, luego ordenar solo los IDs obtenidos
        
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 25);
        // Validar que per_page sea un valor válido (5, 10, 25, 50, 100)
        $allowedPerPage = [5, 10, 25, 50, 100];
        if (!in_array((int)$perPage, $allowedPerPage)) {
            $perPage = 25;
        }
        $offset = ($page - 1) * $perPage;
        
        // Construir query base para filtros (sin ordenar)
        $baseQuery = \DB::table('pdv_visits')
            ->select('pdv_visits.id', 'pdv_visits.check_in_at')
            ->join('pdvs', 'pdv_visits.pdv_id', '=', 'pdvs.id')
            ->join('routes', 'pdvs.route_id', '=', 'routes.id')
            ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
            ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
            ->join('businesses', 'zonales.business_id', '=', 'businesses.id')
            ->whereBetween('pdv_visits.check_in_at', [$fechaDesde . ' 00:00:00', $fechaHasta . ' 23:59:59'])
            ->where('pdvs.status', 'vende')
            ->where('routes.status', true)
            ->where('circuits.status', true)
            ->where('zonales.status', true)
            ->where('businesses.status', true);

        // Aplicar filtros de scope automáticos (negocio y zonal)
        $businessScope = $this->getBusinessScope();
        if (!$businessScope['is_admin']) {
            if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                $baseQuery->whereIn('businesses.id', $businessScope['business_ids']);
            }
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $baseQuery->whereIn('zonales.id', $businessScope['zonal_ids']);
            }
        }

        // Aplicar filtros avanzados
        if ($vendedorId) {
            $baseQuery->where('pdv_visits.user_id', $vendedorId);
        }

        if ($pdvId) {
            $baseQuery->where('pdv_visits.pdv_id', $pdvId);
        }

        if ($estado && $estado !== 'todos') {
            $baseQuery->where('pdv_visits.visit_status', $estado);
        }

        if ($mockLocation && $mockLocation !== 'todos') {
            if ($mockLocation === 'real') {
                $baseQuery->where(function($query) {
                    $query->where('pdv_visits.used_mock_location', false)
                          ->orWhereNull('pdv_visits.used_mock_location');
                });
            } elseif ($mockLocation === 'mock') {
                $baseQuery->where('pdv_visits.used_mock_location', true);
            }
        }

        // Filtros por jerarquía organizacional
        if ($businessId) {
            $baseQuery->where('businesses.id', $businessId);
        }

        if ($zonalId) {
            $baseQuery->where('zonales.id', $zonalId);
        }

        if ($circuitId) {
            $baseQuery->where('circuits.id', $circuitId);
        }

        if ($routeId) {
            $baseQuery->where('routes.id', $routeId);
        }
        
        // Contar total (sin ordenar, más rápido)
        $total = (clone $baseQuery)->count();
        
        // OPTIMIZACIÓN CRÍTICA: Evitar "Out of sort memory"
        // ESTRATEGIA: Usar un subquery que primero obtiene los IDs ordenados usando solo el índice de fecha
        // Luego aplicar los filtros en el query principal usando whereIn (más eficiente)
        
        // Si no hay resultados, retornar vacío inmediatamente
        if ($total === 0) {
            $visitIds = collect();
        } else {
            // Usar un enfoque de dos pasos para evitar ordenar demasiados registros:
            // 1. Obtener IDs ordenados por fecha (usando índice) con un límite razonable
            // 2. Aplicar filtros adicionales usando whereIn en el query principal
            
            // CORREGIDO: Aplicar TODOS los filtros (incluyendo jerarquía) ANTES de obtener IDs candidatos
            // Esto asegura que los IDs candidatos ya incluyan los filtros de circuito/ruta aplicados
            
            // Calcular límite dinámico basado en el total, la página y un factor de seguridad
            $safetyFactor = 2; // Factor más pequeño ya que ahora filtramos antes
            $idsLimit = min($total, max(($offset + $perPage) * $safetyFactor, 1000), 5000); // Máximo 5000 para evitar memoria
            
            // Obtener IDs con fecha aplicando TODOS los filtros desde el principio
            // Esto incluye joins y filtros de jerarquía para asegurar que obtenemos los IDs correctos
            $visitIdsQuery = \DB::table('pdv_visits')
                ->select('pdv_visits.id', 'pdv_visits.check_in_at')
                ->whereBetween('pdv_visits.check_in_at', [$fechaDesde . ' 00:00:00', $fechaHasta . ' 23:59:59'])
                ->join('pdvs', 'pdv_visits.pdv_id', '=', 'pdvs.id')
                ->join('routes', 'pdvs.route_id', '=', 'routes.id')
                ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
                ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
                ->join('businesses', 'zonales.business_id', '=', 'businesses.id')
                ->where('pdvs.status', 'vende')
                ->where('routes.status', true)
                ->where('circuits.status', true)
                ->where('zonales.status', true)
                ->where('businesses.status', true);
            
            // Aplicar scope automático
            if (!$businessScope['is_admin']) {
                if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                    $visitIdsQuery->whereIn('businesses.id', $businessScope['business_ids']);
                }
                if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                    $visitIdsQuery->whereIn('zonales.id', $businessScope['zonal_ids']);
                }
            }
            
            // Aplicar filtros de jerarquía (CRÍTICO: aplicar antes de obtener IDs)
            if ($businessId) {
                $visitIdsQuery->where('businesses.id', $businessId);
            }
            if ($zonalId) {
                $visitIdsQuery->where('zonales.id', $zonalId);
            }
            if ($circuitId) {
                $visitIdsQuery->where('circuits.id', $circuitId);
            }
            if ($routeId) {
                $visitIdsQuery->where('routes.id', $routeId);
            }
            
            // Aplicar filtros de usuario si existen
            if ($vendedorId) {
                $visitIdsQuery->where('pdv_visits.user_id', $vendedorId);
            }
            
            if ($pdvId) {
                $visitIdsQuery->where('pdv_visits.pdv_id', $pdvId);
            }
            
            if ($estado && $estado !== 'todos') {
                $visitIdsQuery->where('pdv_visits.visit_status', $estado);
            }
            
            if ($mockLocation && $mockLocation !== 'todos') {
                if ($mockLocation === 'real') {
                    $visitIdsQuery->where(function($query) {
                        $query->where('pdv_visits.used_mock_location', false)
                              ->orWhereNull('pdv_visits.used_mock_location');
                    });
                } elseif ($mockLocation === 'mock') {
                    $visitIdsQuery->where('pdv_visits.used_mock_location', true);
                }
            }
            
            // Obtener IDs candidatos (SIN ordenar en MySQL para evitar error de memoria)
            $candidateIds = $visitIdsQuery->limit($idsLimit)->get();
            
            // Ordenar candidatos en memoria por fecha descendente
            $candidateIds = $candidateIds->sortByDesc('check_in_at');
            
            // Tomar solo los IDs necesarios para la página actual
            $visitIds = $candidateIds->slice($offset, $perPage)->pluck('id');
        }
        
        // Obtener datos paginados
        // CORREGIDO: Usar try-catch para manejar errores y agregar validación
        try {
            // Si no hay resultados, retornar paginación vacía
            if ($visitIds->isEmpty()) {
                $visitas = new \Illuminate\Pagination\LengthAwarePaginator(
                    collect(),
                    $total,
                    $perPage,
                    $page,
                    ['path' => $request->url(), 'query' => $request->query()]
                );
            } else {
                // Ahora hacer los JOINs solo con los IDs limitados
                // CORREGIDO: NO usar FIELD() porque causa error de memoria en MySQL
                // En su lugar, ordenar los resultados en memoria usando PHP
                if ($visitIds->isEmpty()) {
                    $items = collect();
                } else {
                    // Crear un mapa del orden de los IDs para ordenar después
                    $idOrderMap = $visitIds->flip()->toArray();
                    
                    $query = PdvVisit::query()
                        ->select([
                            'pdv_visits.id',
                            'pdv_visits.user_id',
                            'pdv_visits.pdv_id',
                            'pdv_visits.check_in_at',
                            'pdv_visits.check_out_at',
                            'pdv_visits.visit_status',
                            'pdv_visits.duration_minutes',
                            'pdv_visits.distance_to_pdv',
                            'pdv_visits.latitude',
                            'pdv_visits.longitude',
                            'pdv_visits.used_mock_location',
                            'pdv_visits.visit_photo',
                            'pdv_visits.notes',
                            'pdv_visits.visit_data',
                            'pdv_visits.is_valid',
                            'users.first_name',
                            'users.last_name',
                            'users.username',
                            'pdvs.point_name',
                            'pdvs.client_name',
                            'pdvs.classification',
                            'pdvs.status as pdv_status',
                            'routes.id as route_id',
                            'routes.name as route_name',
                            'circuits.id as circuit_id',
                            'circuits.name as circuit_name',
                            'circuits.code as circuit_code',
                            'zonales.id as zonal_id',
                            'zonales.name as zonal_name',
                            'businesses.id as business_id',
                            'businesses.name as business_name'
                        ])
                        ->join('users', 'pdv_visits.user_id', '=', 'users.id')
                        ->join('pdvs', 'pdv_visits.pdv_id', '=', 'pdvs.id')
                        ->join('routes', 'pdvs.route_id', '=', 'routes.id')
                        ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
                        ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
                        ->join('businesses', 'zonales.business_id', '=', 'businesses.id')
                        ->whereIn('pdv_visits.id', $visitIds);
                    
                    // NO usar orderByRaw con FIELD() - causa error de memoria
                    // Obtener resultados sin ordenar
                    $items = $query->get();
                    
                    // Ordenar en memoria según el orden de los IDs originales
                    // Los resultados de joins directos son stdClass, no modelos Eloquent
                    $items = $items->sortBy(function ($item) use ($idOrderMap) {
                        // Manejar tanto objetos stdClass como arrays
                        if (is_object($item)) {
                            $id = $item->id ?? null;
                        } else {
                            $id = $item['id'] ?? null;
                        }
                        // Retornar la posición en el mapa, o un valor alto si no se encuentra
                        return $idOrderMap[$id] ?? 999999;
                    })->values();
                }

                // Crear paginador manual
                $visitas = new \Illuminate\Pagination\LengthAwarePaginator(
                    $items,
                    $total,
                    $perPage,
                    $page,
                    ['path' => $request->url(), 'query' => $request->query()]
                );
            }

            // Transformar resultados para formato esperado por el frontend
            // CORREGIDO: Convertir a arrays para evitar problemas de serialización con Inertia
            $visitas->getCollection()->transform(function ($visit) {
                // Acceder a propiedades de forma segura (stdClass después de joins)
                // Usar get_object_vars para obtener todas las propiedades disponibles
                $visitArray = is_object($visit) ? get_object_vars($visit) : (array)$visit;
                
                return [
                    'id' => $visitArray['id'] ?? $visit->id ?? null,
                    'check_in_at' => $visitArray['check_in_at'] ?? $visit->check_in_at ?? null,
                    'check_out_at' => $visitArray['check_out_at'] ?? $visit->check_out_at ?? null,
                    'visit_status' => $visitArray['visit_status'] ?? $visit->visit_status ?? null,
                    'duration_minutes' => $visitArray['duration_minutes'] ?? $visit->duration_minutes ?? null,
                    'distance_to_pdv' => $visitArray['distance_to_pdv'] ?? $visit->distance_to_pdv ?? null,
                    'latitude' => $visitArray['latitude'] ?? $visit->latitude ?? null,
                    'longitude' => $visitArray['longitude'] ?? $visit->longitude ?? null,
                    'used_mock_location' => $visitArray['used_mock_location'] ?? $visit->used_mock_location ?? null,
                    'user' => [
                        'id' => $visitArray['user_id'] ?? $visit->user_id ?? null,
                        'first_name' => $visitArray['first_name'] ?? $visit->first_name ?? null,
                        'last_name' => $visitArray['last_name'] ?? $visit->last_name ?? null,
                        'username' => $visitArray['username'] ?? $visit->username ?? null,
                    ],
                    'pdv' => [
                        'id' => $visitArray['pdv_id'] ?? $visit->pdv_id ?? null,
                        'point_name' => $visitArray['point_name'] ?? $visit->point_name ?? null,
                        'client_name' => $visitArray['client_name'] ?? $visit->client_name ?? null,
                        'classification' => $visitArray['classification'] ?? $visit->classification ?? null,
                        'status' => $visitArray['pdv_status'] ?? $visit->pdv_status ?? null,
                        'route_id' => $visitArray['route_id'] ?? $visit->route_id ?? null,
                        'route' => [
                            'id' => $visitArray['route_id'] ?? $visit->route_id ?? null,
                            'name' => $visitArray['route_name'] ?? $visit->route_name ?? null,
                            'circuit_id' => $visitArray['circuit_id'] ?? $visit->circuit_id ?? null,
                            'circuit' => [
                                'id' => $visitArray['circuit_id'] ?? $visit->circuit_id ?? null,
                                'name' => $visitArray['circuit_name'] ?? $visit->circuit_name ?? null,
                                'code' => $visitArray['circuit_code'] ?? $visit->circuit_code ?? null,
                                'zonal_id' => $visitArray['zonal_id'] ?? $visit->zonal_id ?? null,
                                'zonal' => [
                                    'id' => $visitArray['zonal_id'] ?? $visit->zonal_id ?? null,
                                    'name' => $visitArray['zonal_name'] ?? $visit->zonal_name ?? null,
                                    'business_id' => $visitArray['business_id'] ?? $visit->business_id ?? null,
                                    'business' => [
                                        'id' => $visitArray['business_id'] ?? $visit->business_id ?? null,
                                        'name' => $visitArray['business_name'] ?? $visit->business_name ?? null,
                                    ],
                                ],
                            ],
                        ],
                    ],
                ];
            });
        } catch (\Exception $e) {
            // Log del error para debugging
            \Log::error('Error en PdvVisitadosController::index', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'filters' => [
                    'fecha_desde' => $fechaDesde,
                    'fecha_hasta' => $fechaHasta,
                    'business_id' => $businessId,
                    'zonal_id' => $zonalId,
                    'circuit_id' => $circuitId,
                    'route_id' => $routeId,
                    'vendedor_id' => $vendedorId,
                    'pdv_id' => $pdvId,
                    'estado' => $estado,
                ],
                'total' => $total ?? 0,
            ]);
            
            // Retornar resultados vacíos con mensaje de error
            $visitas = new \Illuminate\Pagination\LengthAwarePaginator(
                collect(),
                0,
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
            
            // Continuar con el flujo normal pero sin datos
            // El error se mostrará en los logs para debugging
        }



        // OPTIMIZACIÓN: Usar caché para opciones de filtros (TTL: 5 minutos)
        $businessScope = $this->getBusinessScope();
        $cacheKey = 'pdv_visitados_filter_options_' . md5(json_encode($businessScope));
        $filterOptions = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($businessScope) {
            $circuitsQuery = \App\Models\Circuit::with('zonal.business')->where('status', true);
            $circuitsQuery = $this->applyFullScope($circuitsQuery, 'zonal.business', 'zonal');
            
            // CORREGIDO: Convertir a arrays simples con solo los campos necesarios
            $businesses = $this->getAvailableBusinesses()->map(function ($business) {
                return ['id' => $business->id, 'name' => $business->name];
            })->values()->toArray();
            
            $zonales = $this->getAvailableZonals()->map(function ($zonal) {
                return [
                    'id' => $zonal->id,
                    'name' => $zonal->name,
                    'business_id' => $zonal->business_id
                ];
            })->values()->toArray();
            
            $circuits = $circuitsQuery->orderBy('name')->get(['id', 'name', 'code', 'zonal_id'])
                ->map(function ($circuit) {
                    return [
                        'id' => $circuit->id,
                        'name' => $circuit->name,
                        'code' => $circuit->code,
                        'zonal_id' => $circuit->zonal_id,
                    ];
                })->values()->toArray();
            
            return [
                'businesses' => $businesses,
                'allZonales' => $zonales,
                'allCircuits' => $circuits,
            ];
        });

        // Datos para filtros jerárquicos (desde caché)
        $businesses = $filterOptions['businesses'];
        $allZonales = $filterOptions['allZonales'];

        // Filtrar zonales por negocio seleccionado (en memoria desde caché)
        // CORREGIDO: Asegurar que siempre sea un array
        $zonales = collect($allZonales);
        if ($businessId) {
            $zonales = $zonales->filter(function ($zonal) use ($businessId) {
                return isset($zonal['business_id']) && $zonal['business_id'] == $businessId;
            });
        }
        $zonales = $zonales->values()->toArray(); // Convertir a array con índices numéricos

        // Filtrar circuitos por zonal (en memoria desde caché)
        // CORREGIDO: Asegurar que siempre sea un array
        $allCircuits = $filterOptions['allCircuits'];
        $circuits = collect($allCircuits);
        // Nota: No podemos filtrar por business_id aquí porque no tenemos esa relación en el array
        // Solo filtramos por zonal_id si se selecciona
        if ($zonalId) {
            $circuits = $circuits->filter(function ($circuit) use ($zonalId) {
                return isset($circuit['zonal_id']) && $circuit['zonal_id'] == $zonalId;
            });
        }
        $circuits = $circuits->values()->toArray(); // Convertir a array con índices numéricos

        // OPTIMIZACIÓN: Rutas - cargar todas las rutas según filtros aplicados
        // CORREGIDO: Usar joins directos para mejor rendimiento y evitar errores
        try {
            $routesQuery = \App\Models\Route::query()
                ->select(['routes.id', 'routes.name', 'routes.circuit_id'])
                ->join('circuits', 'routes.circuit_id', '=', 'circuits.id')
                ->join('zonales', 'circuits.zonal_id', '=', 'zonales.id')
                ->join('businesses', 'zonales.business_id', '=', 'businesses.id')
                ->where('routes.status', true)
                ->where('circuits.status', true)
                ->where('zonales.status', true)
                ->where('businesses.status', true)
                ->orderBy('routes.name');
            
            // Aplicar scope automático (negocio y zonal)
            $businessScope = $this->getBusinessScope();
            if (!$businessScope['is_admin']) {
                if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
                    $routesQuery->whereIn('businesses.id', $businessScope['business_ids']);
                }
                if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                    $routesQuery->whereIn('zonales.id', $businessScope['zonal_ids']);
                }
            }
            
            // Si hay filtro de negocio, filtrar por negocio
            if ($businessId) {
                $routesQuery->where('businesses.id', $businessId);
            }
            
            // Si hay filtro de zonal, filtrar por zonal
            if ($zonalId) {
                $routesQuery->where('zonales.id', $zonalId);
            }
            
            // Si hay filtro de circuito, filtrar por circuito
            if ($circuitId) {
                $routesQuery->where('circuits.id', $circuitId);
            }
            
            $routes = $routesQuery->distinct()->get();
            
            // CORREGIDO: Convertir modelos a arrays simples con manejo seguro
            $routes = collect($routes)->map(function ($route) {
                return [
                    'id' => $route->id ?? null,
                    'name' => $route->name ?? 'Sin nombre',
                    'circuit_id' => $route->circuit_id ?? null,
                ];
            })->values()->toArray();
        } catch (\Exception $e) {
            \Log::error('Error al cargar rutas en PdvVisitadosController', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'filters' => [
                    'business_id' => $businessId,
                    'zonal_id' => $zonalId,
                    'circuit_id' => $circuitId,
                ]
            ]);
            $routes = [];
        }

        // OPTIMIZACIÓN: Vendedores - usar caché y optimizar queries
        // CORREGIDO: Asegurar que siempre sea un array y manejar correctamente los joins
        $vendedores = collect();
        if (!$zonalId) {
            $vendedoresCacheKey = 'vendedores_' . md5(json_encode($businessScope));
            $vendedores = \Illuminate\Support\Facades\Cache::remember($vendedoresCacheKey, 300, function () use ($businessScope) {
                // OPTIMIZACIÓN: Usar join directo en lugar de whereHas
                $vendedoresQuery = User::role('Vendedor')
                    ->where('users.status', true)
                    ->select('users.id', 'users.first_name', 'users.last_name', 'users.username');
                
                if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                    $vendedoresQuery->join('user_circuits', 'users.id', '=', 'user_circuits.user_id')
                        ->join('circuits', 'user_circuits.circuit_id', '=', 'circuits.id')
                        ->where('user_circuits.is_active', true)
                        ->whereIn('circuits.zonal_id', $businessScope['zonal_ids'])
                        ->distinct();
                }
                
                return $vendedoresQuery->orderBy('users.first_name')->get();
            });
        } else {
            // OPTIMIZACIÓN: Si hay filtro de zonal, usar join directo
            $vendedoresQuery = User::role('Vendedor')
                ->where('users.status', true)
                ->select('users.id', 'users.first_name', 'users.last_name', 'users.username')
                ->join('user_circuits', 'users.id', '=', 'user_circuits.user_id')
                ->join('circuits', 'user_circuits.circuit_id', '=', 'circuits.id')
                ->where('user_circuits.is_active', true)
                ->where('circuits.zonal_id', $zonalId);
            
            if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
                $vendedoresQuery->whereIn('circuits.zonal_id', $businessScope['zonal_ids']);
            }
            
            $vendedores = $vendedoresQuery->distinct()->orderBy('users.first_name')->get();
        }
        // CORREGIDO: Convertir modelos a arrays simples
        $vendedores = collect($vendedores)->map(function ($vendedor) {
            return [
                'id' => $vendedor->id,
                'first_name' => $vendedor->first_name ?? null,
                'last_name' => $vendedor->last_name ?? null,
                'username' => $vendedor->username ?? null,
            ];
        })->values()->toArray();

        // PDVs - solo cargar si hay filtro de ruta
        // CORREGIDO: Asegurar que siempre sea un array
        $pdvs = collect();
        if ($routeId) {
            $pdvs = Pdv::where('route_id', $routeId)
                ->orderBy('point_name')
                ->get(['id', 'point_name', 'client_name', 'route_id']);
        }
        // CORREGIDO: Convertir modelos a arrays simples
        $pdvs = collect($pdvs)->map(function ($pdv) {
            return [
                'id' => $pdv->id,
                'point_name' => $pdv->point_name ?? null,
                'client_name' => $pdv->client_name ?? null,
                'route_id' => $pdv->route_id ?? null,
            ];
        })->values()->toArray();

        return Inertia::render('reportes/pdvs-visitados/index', [
            'visitas' => $visitas,
            'filtros' => [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                // Preservar valores originales del request para el frontend
                'vendedor_id' => $vendedorIdRaw ?? null,
                'pdv_id' => $pdvIdRaw ?? null,
                'estado' => $estado ?? null,
                'mock_location' => $mockLocation ?? null,
                'business_id' => $businessIdRaw ?? null,
                'zonal_id' => $zonalIdRaw ?? null,
                'circuit_id' => $circuitIdRaw ?? null,
                'route_id' => $routeIdRaw ?? null,
            ],
            'opciones' => [
                'businesses' => $businesses,
                'allZonales' => $allZonales, // Agregar allZonales para filtrado en frontend
                'allCircuits' => $allCircuits, // Agregar allCircuits para filtrado en frontend
                'zonales' => $zonales,
                'circuits' => $circuits,
                'routes' => $routes,
                'vendedores' => $vendedores,
                'pdvs' => $pdvs,
                'estados' => [
                    ['value' => 'in_progress', 'label' => 'En Progreso'],
                    ['value' => 'completed', 'label' => 'Completada'],
                    ['value' => 'cancelled', 'label' => 'Cancelada'],
                ],
            ],
            'businessScope' => $this->getBusinessScope(),
        ]);
    }

    /**
     * Exportar reporte a Excel/PDF
     */
    public function exportar(Request $request)
    {
        // Obtener filtros con valores por defecto del día actual en Perú
        $fechaDesde = $request->get('fecha_desde', now()->format('Y-m-d'));
        $fechaHasta = $request->get('fecha_hasta', now()->format('Y-m-d'));
        $vendedorId = $request->get('vendedor_id');
        $pdvId = $request->get('pdv_id');
        $estado = $request->get('estado');
        $mockLocation = $request->get('mock_location');
        $businessId = $request->get('business_id');
        $zonalId = $request->get('zonal_id');
        $circuitId = $request->get('circuit_id');
        $routeId = $request->get('route_id');
        $formato = $request->get('formato', 'excel');
        $incluirFormularios = $request->get('incluir_formularios', 'true') === 'true';

        // Query para exportación con filtros
        $query = PdvVisit::with([
            'user:id,first_name,last_name,username',
            'pdv:id,point_name,client_name,classification,status,route_id',
            'pdv.route:id,name,circuit_id',
            'pdv.route.circuit:id,name,code,zonal_id',
            'pdv.route.circuit.zonal:id,name,business_id',
            'pdv.route.circuit.zonal.business:id,name'
        ])
        ->whereBetween('check_in_at', [$fechaDesde . ' 00:00:00', $fechaHasta . ' 23:59:59']);

        // Aplicar filtros de scope automáticos (negocio y zonal)
        $query = $this->applyFullScope($query, 'pdv.route.circuit.zonal.business', 'pdv.route.circuit.zonal');

        // Aplicar filtros
        if ($vendedorId && $vendedorId !== 'todos') {
            $query->where('user_id', $vendedorId);
        }

        if ($pdvId && $pdvId !== 'todos') {
            $query->where('pdv_id', $pdvId);
        }

        if ($estado && $estado !== 'todos') {
            $query->where('visit_status', $estado);
        }

        if ($mockLocation && $mockLocation !== 'todos') {
            if ($mockLocation === 'real') {
                $query->where(function($q) {
                    $q->where('used_mock_location', false)
                      ->orWhereNull('used_mock_location');
                });
            } elseif ($mockLocation === 'mock') {
                $query->where('used_mock_location', true);
            }
        }

        if ($businessId && $businessId !== 'todos') {
            $query->whereHas('pdv.route.circuit.zonal', function($q) use ($businessId) {
                $q->where('business_id', $businessId);
            });
        }

        if ($zonalId && $zonalId !== 'todos') {
            $query->whereHas('pdv.route.circuit', function($q) use ($zonalId) {
                $q->where('zonal_id', $zonalId);
            });
        }

        if ($circuitId && $circuitId !== 'todos') {
            $query->whereHas('pdv.route', function($q) use ($circuitId) {
                $q->where('circuit_id', $circuitId);
            });
        }

        if ($routeId && $routeId !== 'todos') {
            $query->whereHas('pdv', function($q) use ($routeId) {
                $q->where('route_id', $routeId);
            });
        }

        $visitas = $query->orderBy('check_in_at', 'desc')->get();

        // Generar nombre del archivo
        $nombreArchivo = "pdvs_visitados_{$fechaDesde}_a_{$fechaHasta}";

        if ($formato === 'pdf') {
            // TODO: Implementar exportación a PDF
            return response()->json(['message' => 'Exportación a PDF próximamente']);
        } else {
            // Exportar a Excel usando la clase de exportación apropiada
            if ($incluirFormularios) {
                return Excel::download(new PdvVisitadosWithFormResponsesExport($visitas), "{$nombreArchivo}_con_formularios.xlsx");
            } else {
                return Excel::download(new PdvVisitadosExport($visitas), "{$nombreArchivo}.xlsx");
            }
        }
    }

    /**
     * Eliminar una visita en estado in_progress
     */
    public function destroy(PdvVisit $visit)
    {
        // Verificar que la visita esté en estado in_progress
        if ($visit->visit_status !== 'in_progress') {
            return back()->with('error', 'Solo se pueden eliminar visitas en estado "En Progreso".');
        }

        // Los permisos se verifican en el middleware de la ruta (acceso general a reportes)

        // Aplicar scope de negocio
        $this->applyFullScope(PdvVisit::query(), 'pdv.route.circuit.zonal.business', 'pdv.route.circuit.zonal')
            ->where('id', $visit->id)
            ->firstOrFail();

        try {
            // Eliminar respuestas de formularios asociadas
            $visit->formResponses()->delete();

            // Eliminar la visita
            $visit->delete();

            return back()->with('success', 'Visita eliminada correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al eliminar la visita: ' . $e->getMessage());
        }
    }

    /**
     * Obtener etiqueta del estado de visita
     */
    private function getEstadoLabel($estado)
    {
        return match($estado) {
            'in_progress' => 'En Progreso',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
            default => 'Desconocido'
        };
    }
}
