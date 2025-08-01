<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GpsTracking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GpsTrackingController extends Controller
{
    /**
     * Registrar una ubicación GPS
     */
    public function recordLocation(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
            'speed' => 'nullable|numeric|min:0',
            'heading' => 'nullable|numeric|between:0,360',
            'battery_level' => 'nullable|integer|between:0,100',
            'is_mock_location' => 'nullable|boolean',
            'recorded_at' => 'nullable|date',
        ]);

        $user = $request->user();

        // Verificar que el usuario tenga una jornada activa
        $hasActiveSession = $user->activeWorkingSessions()->exists();
        
        if (!$hasActiveSession) {
            return response()->json([
                'success' => false,
                'message' => 'Debes iniciar una jornada laboral para registrar ubicaciones.',
            ], 400);
        }

        try {
            $location = GpsTracking::create([
                'user_id' => $user->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'accuracy' => $request->accuracy,
                'speed' => $request->speed,
                'heading' => $request->heading,
                'battery_level' => $request->battery_level,
                'is_mock_location' => $request->boolean('is_mock_location', false),
                'recorded_at' => $request->recorded_at ? 
                    \Carbon\Carbon::parse($request->recorded_at) : 
                    now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ubicación registrada',
                'data' => [
                    'location_id' => $location->id,
                    'recorded_at' => $location->recorded_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar ubicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar múltiples ubicaciones en lote (para cuando hay mala conectividad)
     */
    public function recordBatchLocations(Request $request)
    {
        $request->validate([
            'locations' => 'required|array|min:1|max:100',
            'locations.*.latitude' => 'required|numeric|between:-90,90',
            'locations.*.longitude' => 'required|numeric|between:-180,180',
            'locations.*.accuracy' => 'nullable|numeric|min:0',
            'locations.*.speed' => 'nullable|numeric|min:0',
            'locations.*.heading' => 'nullable|numeric|between:0,360',
            'locations.*.battery_level' => 'nullable|integer|between:0,100',
            'locations.*.is_mock_location' => 'nullable|boolean',
            'locations.*.recorded_at' => 'required|date',
        ]);

        $user = $request->user();
        $locations = $request->locations;

        try {
            DB::beginTransaction();

            $insertData = [];
            $now = now();

            foreach ($locations as $location) {
                $insertData[] = [
                    'user_id' => $user->id,
                    'latitude' => $location['latitude'],
                    'longitude' => $location['longitude'],
                    'accuracy' => $location['accuracy'] ?? null,
                    'speed' => $location['speed'] ?? null,
                    'heading' => $location['heading'] ?? null,
                    'battery_level' => $location['battery_level'] ?? null,
                    'is_mock_location' => $location['is_mock_location'] ?? false,
                    'recorded_at' => \Carbon\Carbon::parse($location['recorded_at']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            GpsTracking::insert($insertData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ubicaciones registradas en lote',
                'data' => [
                    'locations_count' => count($insertData),
                    'processed_at' => $now,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar ubicaciones en lote',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener mi ruta del día actual
     */
    public function getTodayRoute(Request $request)
    {
        $user = $request->user();

        $locations = GpsTracking::where('user_id', $user->id)
            ->whereDate('recorded_at', today())
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude', 'recorded_at', 'speed', 'accuracy']);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => today()->format('Y-m-d'),
                'locations_count' => $locations->count(),
                'locations' => $locations->map(function ($location) {
                    return [
                        'latitude' => (float) $location->latitude,
                        'longitude' => (float) $location->longitude,
                        'recorded_at' => $location->recorded_at,
                        'speed' => $location->speed,
                        'accuracy' => $location->accuracy,
                    ];
                })
            ]
        ]);
    }

    /**
     * Obtener ubicaciones en tiempo real (para dashboard)
     */
    public function getRealTimeLocations(Request $request)
    {
        $request->validate([
            'minutes_ago' => 'nullable|integer|min:1|max:120',
            'circuit_id' => 'nullable|exists:circuits,id',
            'zonal_id' => 'nullable|exists:zonales,id',
        ]);

        $minutesAgo = $request->get('minutes_ago', 30);
        $timeThreshold = now()->subMinutes($minutesAgo);

        // Query base para obtener la última ubicación de cada usuario
        $query = DB::table('gps_tracking as gt')
            ->select([
                'gt.user_id',
                'gt.latitude',
                'gt.longitude',
                'gt.recorded_at',
                'gt.speed',
                'gt.battery_level',
                'gt.is_mock_location',
                'u.first_name',
                'u.last_name',
                'u.username',
                'c.name as circuit_name',
                'c.code as circuit_code',
                'z.name as zonal_name'
            ])
            ->join('users as u', 'gt.user_id', '=', 'u.id')
            ->leftJoin('user_circuits as uc', function($join) {
                $join->on('u.id', '=', 'uc.user_id')
                     ->where('uc.is_active', true);
            })
            ->leftJoin('circuits as c', 'uc.circuit_id', '=', 'c.id')
            ->leftJoin('zonales as z', 'c.zonal_id', '=', 'z.id')
            ->where('gt.recorded_at', '>=', $timeThreshold)
            ->where('u.status', true)
            ->whereIn('gt.id', function($subquery) {
                $subquery->select(DB::raw('MAX(id)'))
                    ->from('gps_tracking')
                    ->groupBy('user_id');
            });

        // Aplicar filtros
        if ($request->circuit_id) {
            $query->where('c.id', $request->circuit_id);
        }

        if ($request->zonal_id) {
            $query->where('z.id', $request->zonal_id);
        }

        $locations = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'last_update' => now(),
                'minutes_ago' => $minutesAgo,
                'locations' => $locations->map(function ($location) {
                    return [
                        'user_id' => $location->user_id,
                        'user_name' => $location->first_name . ' ' . $location->last_name,
                        'username' => $location->username,
                        'latitude' => (float) $location->latitude,
                        'longitude' => (float) $location->longitude,
                        'recorded_at' => $location->recorded_at,
                        'speed' => $location->speed,
                        'battery_level' => $location->battery_level,
                        'is_mock_location' => (bool) $location->is_mock_location,
                        'circuit_name' => $location->circuit_name,
                        'circuit_code' => $location->circuit_code,
                        'zonal_name' => $location->zonal_name,
                    ];
                })
            ]
        ]);
    }

    /**
     * Obtener ruta de un usuario específico (para dashboard)
     */
    public function getUserRoute(Request $request, User $user)
    {
        $request->validate([
            'date' => 'nullable|date',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        // Si se especifica una fecha, usar esa
        if ($request->date) {
            $dateFrom = $request->date;
            $dateTo = $request->date;
        } 
        // Si se especifica un rango, usar el rango
        else if ($request->date_from && $request->date_to) {
            $dateFrom = $request->date_from;
            $dateTo = $request->date_to;
        }
        // Por defecto, usar hoy
        else {
            $dateFrom = today()->format('Y-m-d');
            $dateTo = today()->format('Y-m-d');
        }

        $query = GpsTracking::where('user_id', $user->id)
            ->whereDate('recorded_at', '>=', $dateFrom)
            ->whereDate('recorded_at', '<=', $dateTo)
            ->orderBy('recorded_at');

        $locations = $query->get(['latitude', 'longitude', 'recorded_at', 'speed', 'accuracy']);

        // Obtener también las visitas PDV del mismo período
        $visits = $user->pdvVisits()
            ->with('pdv:id,point_name,latitude,longitude')
            ->whereDate('check_in_at', '>=', $dateFrom)
            ->whereDate('check_in_at', '<=', $dateTo)
            ->orderBy('check_in_at')
            ->get(['id', 'pdv_id', 'check_in_at', 'check_out_at', 'latitude', 'longitude', 'visit_status']);

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'locations_count' => $locations->count(),
                'visits_count' => $visits->count(),
                'locations' => $locations->map(function ($location) {
                    return [
                        'latitude' => (float) $location->latitude,
                        'longitude' => (float) $location->longitude,
                        'recorded_at' => $location->recorded_at,
                        'speed' => $location->speed,
                        'accuracy' => $location->accuracy,
                    ];
                }),
                'visits' => $visits->map(function ($visit) {
                    return [
                        'visit_id' => $visit->id,
                        'pdv_name' => $visit->pdv->point_name,
                        'pdv_latitude' => (float) $visit->pdv->latitude,
                        'pdv_longitude' => (float) $visit->pdv->longitude,
                        'visit_latitude' => (float) $visit->latitude,
                        'visit_longitude' => (float) $visit->longitude,
                        'check_in_at' => $visit->check_in_at,
                        'check_out_at' => $visit->check_out_at,
                        'status' => $visit->visit_status,
                    ];
                })
            ]
        ]);
    }
}