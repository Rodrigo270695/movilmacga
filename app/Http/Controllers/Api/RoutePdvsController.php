<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoutePdvsController extends Controller
{
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
        if ($todayOnly && !$hasVisitToday) {
            return response()->json([
                'success' => true,
                'data' => [
                    'route' => [
                        'id' => $route->id,
                        'name' => $route->name,
                        'code' => $route->code,
                        'has_visit_today' => false,
                    ],
                    'current_date' => $todayDate,
                    'timezone' => 'America/Lima',
                    'filter_today_only' => true,
                    'pdvs_count' => 0,
                    'pdvs' => []
                ]
            ]);
        }

        // Obtener PDVs de la ruta (todos sin filtrar por estado)
        $pdvs = $route->pdvs()
            ->with(['route:id,name,code', 'locality:id,name', 'district:id,name'])
            ->get()
            ->map(function ($pdv) use ($user, $todayDate) {
                // Verificar si ya se visitó hoy
                $visitedToday = DB::table('pdv_visits')
                    ->where('pdv_id', $pdv->id)
                    ->where('user_id', $user->id)
                    ->whereDate('check_in_at', $todayDate)
                    ->where('is_valid', true)
                    ->exists();

                return [
                    'id' => $pdv->id,
                    'name' => $pdv->point_name,
                    'pos_id' => $pdv->pos_id,
                    'address' => $pdv->address,
                    'status' => $pdv->status,
                    'latitude' => $pdv->latitude,
                    'longitude' => $pdv->longitude,
                    'locality_name' => $pdv->locality->name ?? null,
                    'district_name' => $pdv->district->name ?? null,
                    'visited_today' => $visitedToday,
                    // Campos adicionales para la pantalla de visita
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
                    ]
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'route' => [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
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

        // Obtener PDVs de la ruta (todos sin filtrar por estado)
        $pdvs = $route->pdvs()
            ->with(['locality:id,name', 'district:id,name'])
            ->get()
            ->map(function ($pdv) use ($user, $todayDate) {
                // Verificar si ya se visitó hoy
                $visitedToday = DB::table('pdv_visits')
                    ->where('pdv_id', $pdv->id)
                    ->where('user_id', $user->id)
                    ->whereDate('check_in_at', $todayDate)
                    ->where('is_valid', true)
                    ->exists();

                return [
                    'id' => $pdv->id,
                    'name' => $pdv->point_name,
                    'pos_id' => $pdv->pos_id,
                    'address' => $pdv->address,
                    'status' => $pdv->status,
                    'latitude' => $pdv->latitude,
                    'longitude' => $pdv->longitude,
                    'locality_name' => $pdv->locality->name ?? null,
                    'district_name' => $pdv->district->name ?? null,
                    'visited_today' => $visitedToday,
                    // Campos adicionales para la pantalla de visita
                    'client_name' => $pdv->client_name,
                    'document_type' => $pdv->document_type,
                    'document_number' => $pdv->document_number,
                    'phone' => $pdv->phone,
                    'classification' => $pdv->classification,
                    'email' => $pdv->email,
                    'sells_recharge' => $pdv->sells_recharge,
                    'reference' => $pdv->reference,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'route' => [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
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
}
