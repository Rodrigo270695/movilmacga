<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Circuit;
use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CircuitRoutesController extends Controller
{
    /**
     * Obtener rutas de un circuito con sus fechas de visita
     * Parámetro 'today_only' para filtrar solo rutas con visita programada para hoy
     */
    public function getCircuitRoutes(Request $request, Circuit $circuit)
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

        // Verificar si se debe filtrar solo rutas de hoy
        $todayOnly = $request->query('today_only', 'false') === 'true';

        // Construir la consulta base
        $routesQuery = $circuit->routes()
            ->with(['visitDates' => function ($query) use ($todayDate, $todayOnly) {
                if ($todayOnly) {
                    $query->where('visit_date', $todayDate)
                          ->where('is_active', true);
                } else {
                    $query->where('is_active', true)
                          ->orderBy('visit_date');
                }
            }])
            ->where('status', true);

        // Aplicar filtro de fecha si se solicita
        if ($todayOnly) {
            $routesQuery->whereHas('visitDates', function ($query) use ($todayDate) {
                $query->where('visit_date', $todayDate)
                      ->where('is_active', true);
            });
        }

        $routes = $routesQuery->get()
            ->map(function ($route) use ($todayDate, $user) {
                // Verificar si tiene visita programada para hoy
                $todayVisit = $route->visitDates
                    ->where('visit_date', $todayDate)
                    ->first();

                // Contar PDVs de esta ruta (todos sin filtrar por estado)
                $pdvsCount = $route->pdvs()->count();

                // Contar visitas realizadas hoy a esta ruta
                $visitsToday = DB::table('pdv_visits as pv')
                    ->join('pdvs as p', 'pv.pdv_id', '=', 'p.id')
                    ->where('p.route_id', $route->id)
                    ->where('pv.user_id', $user->id)
                    ->whereDate('pv.check_in_at', $todayDate)
                    ->where('pv.is_valid', true)
                    ->count();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'status' => $route->status,
                    'has_visit_today' => $todayVisit ? true : false,
                    'today_visit_date' => $todayVisit ? $todayVisit->visit_date : null,
                    'today_visit_notes' => $todayVisit ? $todayVisit->notes : null,
                    'pdvs_count' => $pdvsCount,
                    'visits_today' => $visitsToday,
                    'all_visit_dates' => $route->visitDates->map(function ($visitDate) {
                        return [
                            'date' => $visitDate->visit_date,
                            'notes' => $visitDate->notes,
                            'is_active' => $visitDate->is_active,
                            'formatted_date' => \Carbon\Carbon::parse($visitDate->visit_date)->format('d/m/Y'),
                            'day_of_week' => \Carbon\Carbon::parse($visitDate->visit_date)->format('l'),
                        ];
                    }),
                ];
            });

        // Calcular estadísticas
        $totalRoutes = $routes->count();
        $routesWithVisitsToday = $routes->where('has_visit_today', true)->count();
        $totalPdvs = $routes->sum('pdvs_count');
        $totalVisitsToday = $routes->sum('visits_today');

        return response()->json([
            'success' => true,
            'data' => [
                'circuit' => [
                    'id' => $circuit->id,
                    'name' => $circuit->name,
                    'code' => $circuit->code,
                    'status' => $circuit->status,
                    'zonal_name' => $circuit->zonal->name ?? null,
                ],
                'current_date' => $todayDate,
                'timezone' => 'America/Lima',
                'filter_today_only' => $todayOnly,
                'stats' => [
                    'total_routes' => $totalRoutes,
                    'routes_with_visits_today' => $routesWithVisitsToday,
                    'total_pdvs' => $totalPdvs,
                    'total_visits_today' => $totalVisitsToday,
                ],
                'routes' => $routes->values()
            ]
        ]);
    }

    /**
     * Obtener rutas de un circuito que tienen visita programada para hoy
     * Filtra solo las rutas que deben visitarse hoy
     */
    public function getTodayCircuitRoutes(Request $request, Circuit $circuit)
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

        // Obtener solo las rutas que tienen visita programada para hoy
        $routes = $circuit->routes()
            ->with(['visitDates' => function ($query) use ($todayDate) {
                $query->where('visit_date', $todayDate)
                      ->where('is_active', true);
            }])
            ->whereHas('visitDates', function ($query) use ($todayDate) {
                $query->where('visit_date', $todayDate)
                      ->where('is_active', true);
            })
            ->where('status', true)
            ->get()
            ->map(function ($route) use ($user, $todayDate) {
                // Contar PDVs de esta ruta (todos sin filtrar por estado)
                $pdvsCount = $route->pdvs()->count();

                // Contar visitas realizadas hoy a esta ruta
                $visitsToday = DB::table('pdv_visits as pv')
                    ->join('pdvs as p', 'pv.pdv_id', '=', 'p.id')
                    ->where('p.route_id', $route->id)
                    ->where('pv.user_id', $user->id)
                    ->whereDate('pv.check_in_at', $todayDate)
                    ->where('pv.is_valid', true)
                    ->count();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'status' => $route->status,
                    'pdvs_count' => $pdvsCount,
                    'visits_today' => $visitsToday,
                    'visit_date' => $todayDate,
                    'visit_notes' => $route->visitDates->first()?->notes,
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
                'total_pdvs' => $routes->sum('pdvs_count'),
                'total_visits_today' => $routes->sum('visits_today'),
                'routes' => $routes->values()
            ]
        ]);
    }
}
