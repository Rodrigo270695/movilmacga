<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PdvVisit;
use App\Models\Route;
use Illuminate\Http\Request;

class RoutePdvsController extends Controller
{
    private const DEFAULT_MAX_VISITS_PER_PDV_PER_DAY = 2;

    /**
     * Obtener PDVs de una ruta específica
     * Parámetro 'today_only' para filtrar solo PDVs de rutas con visita programada para hoy
     */
    public function getRoutePdvs(Request $request, Route $route)
    {
        $user = $request->user();

        // Verificar que el usuario tenga acceso a esta ruta
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $route->circuit_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta ruta.',
            ], 403);
        }

        // Obtener fecha actual en zona horaria de Perú
        $peruDate = now()->setTimezone('America/Lima');
        $todayDate = $peruDate->format('Y-m-d');

        // Verificar si se debe filtrar solo PDVs de rutas con visita programada para hoy
        $todayOnly = $request->query('today_only', 'false') === 'true';

        // Verificar si la ruta tiene visita programada para hoy
        $hasVisitToday = $route->visitDates()
            ->where('visit_date', $todayDate)
            ->where('is_active', true)
            ->exists();

        // Si se solicita filtrar por hoy y la ruta no tiene visita programada, devolver vacío
        // NOTA: Comentado para permitir extrarutas - siempre mostrar PDVs si el usuario tiene acceso
        // if ($todayOnly && !$hasVisitToday) {
        //     return response()->json([
        //         'success' => true,
        //         'data' => [
        //             'route' => [
        //                 'id' => $route->id,
        //                 'name' => $route->name,
        //                 'code' => $route->code,
        //                 'telegestion' => $route->telegestion ?? false,
        //                 'has_visit_today' => false,
        //             ],
        //             'current_date' => $todayDate,
        //             'timezone' => 'America/Lima',
        //             'filter_today_only' => true,
        //             'pdvs_count' => 0,
        //             'pdvs' => []
        //         ]
        //     ]);
        // }

        // Obtener PDVs de la ruta (excluyendo los que no venden)
        $maxVisitsPerDay = $this->maxVisitsPerDayForRoute($route);
        $pdvs = $route->pdvs()
            ->where('status', '!=', 'no vende') // Excluir PDVs que no venden
            ->with(['route:id,name,code', 'locality:id,name', 'district:id,name'])
            ->get()
            ->map(function ($pdv) use ($user, $todayDate, $maxVisitsPerDay) {
                $visitStatus = $this->visitStatusForPdv($pdv, $user, $todayDate, $maxVisitsPerDay);

                return array_merge([
                    'id' => $pdv->id,
                    'name' => $pdv->point_name,
                    'pos_id' => $pdv->pos_id,
                    'address' => $pdv->address,
                    'status' => $pdv->status,
                    'latitude' => $pdv->latitude,
                    'longitude' => $pdv->longitude,
                    'locality_name' => $pdv->locality->name ?? null,
                    'district_name' => $pdv->district->name ?? null,
                    'client_name' => $pdv->client_name,
                    'document_type' => $pdv->document_type,
                    'document_number' => $pdv->document_number,
                    'phone' => $pdv->phone,
                    'classification' => $pdv->classification,
                    'email' => $pdv->email,
                    'sells_recharge' => $pdv->sells_recharge,
                    'reference' => $pdv->reference,
                    'route_info' => [
                        'id' => $pdv->route->id,
                        'name' => $pdv->route->name,
                        'code' => $pdv->route->code,
                        'telegestion' => (bool)($pdv->route->telegestion ?? false),
                    ],
                ], $visitStatus);
            });

        return response()->json([
            'success' => true,
            'data' => [
                'route' => [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'telegestion' => (bool)($route->telegestion ?? false), // Asegurar que sea boolean
                    'has_visit_today' => $hasVisitToday,
                    'visit_date' => $hasVisitToday ? $todayDate : null,
                ],
                'current_date' => $todayDate,
                'timezone' => 'America/Lima',
                'filter_today_only' => $todayOnly,
                'pdvs_count' => $pdvs->count(),
                'visited_today_count' => $pdvs->where('visited_today', true)->count(),
                'pdvs' => $pdvs->values()
            ]
        ]);
    }

    /**
     * Obtener PDVs de una ruta que deben visitarse hoy
     * Solo devuelve PDVs si la ruta tiene visita programada para hoy
     */
    public function getTodayRoutePdvs(Request $request, Route $route)
    {
        $user = $request->user();

        // Verificar que el usuario tenga acceso a esta ruta
        $hasAccess = $user->activeUserCircuits()
            ->where('circuit_id', $route->circuit_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta ruta.',
            ], 403);
        }

        // Obtener fecha actual en zona horaria de Perú
        $peruDate = now()->setTimezone('America/Lima');
        $todayDate = $peruDate->format('Y-m-d');

        // Verificar si la ruta tiene visita programada para hoy
        $visitDate = $route->visitDates()
            ->where('visit_date', $todayDate)
            ->where('is_active', true)
            ->first();

        if (!$visitDate) {
            return response()->json([
                'success' => true,
                'message' => 'Esta ruta no tiene visita programada para hoy.',
                'data' => [
                    'route' => [
                        'id' => $route->id,
                        'name' => $route->name,
                        'code' => $route->code,
                    ],
                    'current_date' => $todayDate,
                    'timezone' => 'America/Lima',
                    'pdvs_count' => 0,
                    'pdvs' => []
                ]
            ]);
        }

        // Obtener PDVs de la ruta (excluyendo los que no venden)
        $maxVisitsPerDay = $this->maxVisitsPerDayForRoute($route);
        $pdvs = $route->pdvs()
            ->where('status', '!=', 'no vende') // Excluir PDVs que no venden
            ->with(['locality:id,name', 'district:id,name'])
            ->get()
            ->map(function ($pdv) use ($user, $todayDate, $maxVisitsPerDay) {
                $visitStatus = $this->visitStatusForPdv($pdv, $user, $todayDate, $maxVisitsPerDay);

                return array_merge([
                    'id' => $pdv->id,
                    'name' => $pdv->point_name,
                    'pos_id' => $pdv->pos_id,
                    'address' => $pdv->address,
                    'status' => $pdv->status,
                    'latitude' => $pdv->latitude,
                    'longitude' => $pdv->longitude,
                    'locality_name' => $pdv->locality->name ?? null,
                    'district_name' => $pdv->district->name ?? null,
                    'client_name' => $pdv->client_name,
                    'document_type' => $pdv->document_type,
                    'document_number' => $pdv->document_number,
                    'phone' => $pdv->phone,
                    'classification' => $pdv->classification,
                    'email' => $pdv->email,
                    'sells_recharge' => $pdv->sells_recharge,
                    'reference' => $pdv->reference,
                ], $visitStatus);
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'route' => [
                        'id' => $route->id,
                        'name' => $route->name,
                        'code' => $route->code,
                        'telegestion' => $route->telegestion ?? false,
                        'visit_date' => $todayDate,
                        'visit_notes' => $visitDate->notes,
                    ],
                'current_date' => $todayDate,
                'timezone' => 'America/Lima',
                'pdvs_count' => $pdvs->count(),
                'visited_today_count' => $pdvs->where('visited_today', true)->count(),
                'pdvs' => $pdvs->values()
            ]
        ]);
    }

    private function maxVisitsPerDayForRoute(Route $route): int
    {
        $route->loadMissing('circuit.zonal.business');

        return $route->circuit?->zonal?->business?->max_visits_per_pdv_per_day
            ?? self::DEFAULT_MAX_VISITS_PER_PDV_PER_DAY;
    }

    /**
     * Estado de visita de un PDV para el usuario en la fecha indicada,
     * incluyendo si aún puede volver a visitarlo según el tope del negocio.
     */
    private function visitStatusForPdv($pdv, $user, string $todayDate, int $maxVisitsPerDay): array
    {
        $visitsToday = PdvVisit::where('pdv_id', $pdv->id)
            ->where('user_id', $user->id)
            ->whereDate('check_in_at', $todayDate)
            ->orderBy('check_in_at', 'desc')
            ->get();

        $completedVisits = $visitsToday->where('visit_status', 'completed');
        $validCompletedVisits = $completedVisits->filter(fn ($visit) => $visit->is_valid);
        $inProgressVisit = $visitsToday->firstWhere('visit_status', 'in_progress');
        $latestVisit = $visitsToday->first();
        $completedCount = $completedVisits->count();
        // Visitado = hay check-out completado hoy, igual que el reporte web.
        // Antes se exigía is_valid (dentro del geofence); una visita a 49 km
        // quedaba Completada en web y Pendiente en la APK.
        $visitedToday = $completedVisits->isNotEmpty();
        $visitInProgress = (bool) $inProgressVisit;

        return [
            'visited_today' => $visitedToday,
            'visit_in_progress' => $visitInProgress,
            'visit_id' => $inProgressVisit?->id,
            'visit_check_in_at' => $latestVisit?->check_in_at,
            'visit_check_out_at' => $latestVisit?->check_out_at,
            'visit_duration_minutes' => $latestVisit?->duration_minutes,
            'visits_today_count' => $completedCount,
            'max_visits_per_day' => $maxVisitsPerDay,
            'is_valid' => $validCompletedVisits->isNotEmpty(),
            'can_revisit' => $visitedToday && !$visitInProgress && $completedCount < $maxVisitsPerDay,
        ];
    }
}
