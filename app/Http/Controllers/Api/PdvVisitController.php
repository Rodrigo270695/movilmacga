<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Geofence;
use App\Models\Pdv;
use App\Models\PdvVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PdvVisitController extends Controller
{
    /**
     * Hacer check-in en un PDV
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'pdv_id' => 'required|exists:pdvs,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $pdv = Pdv::findOrFail($request->pdv_id);

        // Verificar que el usuario tenga una jornada activa
        $hasActiveSession = $user->activeWorkingSessions()->exists();

        if (!$hasActiveSession) {
            return response()->json([
                'success' => false,
                'message' => 'Debes iniciar una jornada laboral para hacer check-in.',
            ], 400);
        }

        // Verificar que no haya visitado este PDV hoy
        $todayVisit = PdvVisit::where('user_id', $user->id)
            ->where('pdv_id', $pdv->id)
            ->whereDate('check_in_at', now()->toDateString())
            ->where('visit_status', 'completed')
            ->first();

        if ($todayVisit) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has visitado este PDV hoy. No puedes hacer otra visita en el mismo día.',
                'data' => [
                    'previous_visit_id' => $todayVisit->id,
                    'previous_visit_time' => $todayVisit->check_in_at,
                ]
            ], 400);
        }

        // Verificar que no tenga una visita activa en otro PDV
        $activeVisit = PdvVisit::where('user_id', $user->id)
            ->where('visit_status', 'in_progress')
            ->first();

        if ($activeVisit) {
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes una visita activa en otro PDV. Debes finalizarla primero.',
                'data' => [
                    'active_visit_id' => $activeVisit->id,
                    'active_pdv_name' => $activeVisit->pdv->point_name,
                ]
            ], 400);
        }

        // Calcular distancia al PDV
        $distanceToPdv = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $pdv->latitude,
            $pdv->longitude
        );

        // TEMPORALMENTE DESHABILITADO PARA TESTING - Verificar geofence si existe
        // $geofence = Geofence::where('pdv_id', $pdv->id)
        //     ->where('is_active', true)
        //     ->first();

        // $isWithinGeofence = true;
        // if ($geofence) {
        //     $geofenceDistance = $this->calculateDistance(
        //         $request->latitude,
        //         $request->longitude,
        //         $geofence->center_latitude,
        //         $geofence->center_longitude
        //     );
        //     $isWithinGeofence = $geofenceDistance <= ($geofence->radius_meters / 1000); // Convertir a km
        // }

        // Para testing: permitir visitas desde cualquier distancia
        $isWithinGeofence = true;

        try {
            DB::beginTransaction();

            $visit = PdvVisit::create([
                'user_id' => $user->id,
                'pdv_id' => $pdv->id,
                'check_in_at' => now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'distance_to_pdv' => round($distanceToPdv * 1000, 2), // Convertir a metros
                'notes' => $request->notes,
                'visit_status' => 'in_progress',
                'is_valid' => $isWithinGeofence, // Marcar como válida si está dentro del geofence
                'visit_data' => [
                    'check_in_device_info' => [
                        'user_agent' => $request->userAgent(),
                        'ip' => $request->ip(),
                    ],
                    'geofence_validation' => [
                        'within_geofence' => $isWithinGeofence,
                        'distance_to_geofence' => null, // Comentado para testing
                        'geofence_radius' => null, // Comentado para testing
                    ]
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $isWithinGeofence ?
                    'Check-in realizado exitosamente' :
                    'Check-in realizado pero estás fuera del área permitida',
                'data' => [
                    'visit_id' => $visit->id,
                    'pdv_name' => $pdv->point_name,
                    'check_in_at' => $visit->check_in_at,
                    'distance_to_pdv_meters' => $visit->distance_to_pdv,
                    'is_within_geofence' => $isWithinGeofence,
                    'is_valid' => $visit->is_valid,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al hacer check-in',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hacer check-out de un PDV
     */
    public function checkOut(Request $request)
    {
        $request->validate([
            'visit_id' => 'required|exists:pdv_visits,id',
            'notes' => 'nullable|string|max:500',
            'visit_data' => 'nullable|array', // Datos adicionales del formulario
        ]);

        $user = $request->user();
        $visit = PdvVisit::where('id', $request->visit_id)
            ->where('user_id', $user->id)
            ->where('visit_status', 'in_progress')
            ->firstOrFail();

        try {
            DB::beginTransaction();

            $durationMinutes = now()->diffInMinutes($visit->check_in_at);

            $visit->update([
                'check_out_at' => now(),
                'visit_status' => 'completed',
                'duration_minutes' => $durationMinutes,
                'notes' => $visit->notes . ($request->notes ? "\n\nSalida: " . $request->notes : ''),
                'visit_data' => array_merge($visit->visit_data ?? [], [
                    'check_out_device_info' => [
                        'user_agent' => $request->userAgent(),
                        'ip' => $request->ip(),
                    ],
                    'additional_data' => $request->visit_data ?? []
                ])
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Check-out realizado exitosamente',
                'data' => [
                    'visit_id' => $visit->id,
                    'check_out_at' => $visit->check_out_at,
                    'duration_minutes' => $durationMinutes,
                    'status' => 'completed',
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al hacer check-out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir foto de evidencia
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'visit_id' => 'required|exists:pdv_visits,id',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120', // Max 5MB
            'photo_type' => 'nullable|string|in:exterior,interior,products,receipt',
        ]);

        $user = $request->user();
        $visit = PdvVisit::where('id', $request->visit_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            // Crear directorio organizado por fecha
            $directory = 'pdv-visits/' . now()->format('Y/m/d');

            // Generar nombre único para la foto
            $photoName = 'visit_' . $visit->id . '_' . time() . '_' . uniqid() . '.' .
                        $request->file('photo')->getClientOriginalExtension();

            // Guardar la foto
            $photoPath = $request->file('photo')->storeAs($directory, $photoName, 'public');

            // Actualizar la visita con la ruta de la foto
            $visit->update([
                'visit_photo' => $photoPath,
                'visit_data' => array_merge($visit->visit_data ?? [], [
                    'photo_info' => [
                        'original_name' => $request->file('photo')->getClientOriginalName(),
                        'size_bytes' => $request->file('photo')->getSize(),
                        'photo_type' => $request->photo_type ?? 'general',
                        'uploaded_at' => now(),
                    ]
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Foto subida exitosamente',
                'data' => [
                    'visit_id' => $visit->id,
                    'photo_path' => $photoPath,
                    'photo_url' => Storage::url($photoPath),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener mis visitas del día
     */
    public function getTodayVisits(Request $request)
    {
        $user = $request->user();

        $visits = PdvVisit::with('pdv:id,point_name,address,classification,status')
            ->where('user_id', $user->id)
            ->whereDate('check_in_at', today())
            ->orderBy('check_in_at', 'desc')
            ->get()
            ->map(function ($visit) {
                return [
                    'visit_id' => $visit->id,
                    'pdv' => [
                        'id' => $visit->pdv->id,
                        'name' => $visit->pdv->point_name,
                        'address' => $visit->pdv->address,
                        'classification' => $visit->pdv->classification,
                        'status' => $visit->pdv->status,
                    ],
                    'check_in_at' => $visit->check_in_at,
                    'check_out_at' => $visit->check_out_at,
                    'duration_minutes' => $visit->duration_minutes,
                    'distance_to_pdv_meters' => $visit->distance_to_pdv,
                    'visit_status' => $visit->visit_status,
                    'is_valid' => $visit->is_valid,
                    'has_photo' => !is_null($visit->visit_photo),
                    'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'date' => today()->format('Y-m-d'),
                'visits_count' => $visits->count(),
                'completed_visits' => $visits->where('visit_status', 'completed')->count(),
                'in_progress_visits' => $visits->where('visit_status', 'in_progress')->count(),
                'visits' => $visits
            ]
        ]);
    }

    /**
     * Obtener todas mis visitas (historial completo)
     */
    public function getMyVisits(Request $request)
    {
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|in:completed,in_progress,cancelled',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $user = $request->user();
        $perPage = $request->input('per_page', 20);

        $query = PdvVisit::with([
            'pdv:id,point_name,address,classification,status',
            'pdv.route:id,name',
            'pdv.route.circuit:id,name'
        ])
        ->where('user_id', $user->id);

        // Filtros opcionales
        if ($request->has('status')) {
            $query->where('visit_status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('check_in_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('check_in_at', '<=', $request->date_to);
        }

        $visits = $query->orderBy('check_in_at', 'desc')
            ->paginate($perPage);

        $mappedVisits = $visits->getCollection()->map(function ($visit) {
            return [
                'visit_id' => $visit->id,
                'pdv' => [
                    'id' => $visit->pdv->id,
                    'name' => $visit->pdv->point_name,
                    'address' => $visit->pdv->address,
                    'classification' => $visit->pdv->classification,
                    'status' => $visit->pdv->status,
                ],
                'route' => [
                    'id' => $visit->pdv->route->id ?? null,
                    'name' => $visit->pdv->route->name ?? 'Sin ruta',
                ],
                'circuit' => [
                    'id' => $visit->pdv->route->circuit->id ?? null,
                    'name' => $visit->pdv->route->circuit->name ?? 'Sin circuito',
                ],
                'check_in_at' => $visit->check_in_at,
                'check_out_at' => $visit->check_out_at,
                'duration_minutes' => $visit->duration_minutes,
                'distance_to_pdv_meters' => $visit->distance_to_pdv,
                'visit_status' => $visit->visit_status,
                'is_valid' => $visit->is_valid,
                'has_photo' => !is_null($visit->visit_photo),
                'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                'notes' => $visit->notes,
                'date' => $visit->check_in_at->format('Y-m-d'),
                'time' => $visit->check_in_at->format('H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'visits' => $mappedVisits,
                'pagination' => [
                    'current_page' => $visits->currentPage(),
                    'last_page' => $visits->lastPage(),
                    'per_page' => $visits->perPage(),
                    'total' => $visits->total(),
                    'from' => $visits->firstItem(),
                    'to' => $visits->lastItem(),
                ],
                'summary' => [
                    'total_visits' => $visits->total(),
                    'completed_visits' => PdvVisit::where('user_id', $user->id)
                        ->where('visit_status', 'completed')->count(),
                    'in_progress_visits' => PdvVisit::where('user_id', $user->id)
                        ->where('visit_status', 'in_progress')->count(),
                    'cancelled_visits' => PdvVisit::where('user_id', $user->id)
                        ->where('visit_status', 'cancelled')->count(),
                ]
            ]
        ]);
    }

    /**
     * Obtener detalles de una visita específica
     */
    public function getVisitDetails(Request $request, PdvVisit $visit)
    {
        // Verificar que la visita pertenezca al usuario
        if ($visit->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta visita.',
            ], 403);
        }

        $visit->load('pdv:id,point_name,address,latitude,longitude,classification,status');

        return response()->json([
            'success' => true,
            'data' => [
                'visit_id' => $visit->id,
                'pdv' => [
                    'id' => $visit->pdv->id,
                    'name' => $visit->pdv->point_name,
                    'address' => $visit->pdv->address,
                    'latitude' => (float) $visit->pdv->latitude,
                    'longitude' => (float) $visit->pdv->longitude,
                    'classification' => $visit->pdv->classification,
                    'status' => $visit->pdv->status,
                ],
                'check_in_at' => $visit->check_in_at,
                'check_out_at' => $visit->check_out_at,
                'duration_minutes' => $visit->duration_minutes,
                'visit_latitude' => (float) $visit->latitude,
                'visit_longitude' => (float) $visit->longitude,
                'distance_to_pdv_meters' => $visit->distance_to_pdv,
                'visit_status' => $visit->visit_status,
                'is_valid' => $visit->is_valid,
                'notes' => $visit->notes,
                'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                'visit_data' => $visit->visit_data,
            ]
        ]);
    }

    /**
     * Actualizar datos adicionales de la visita
     */
    public function updateVisitData(Request $request, PdvVisit $visit)
    {
        $request->validate([
            'visit_data' => 'required|array',
        ]);

        // Verificar que la visita pertenezca al usuario
        if ($visit->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta visita.',
            ], 403);
        }

        $visit->update([
            'visit_data' => array_merge($visit->visit_data ?? [], $request->visit_data)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Datos de visita actualizados',
            'data' => [
                'visit_id' => $visit->id,
                'visit_data' => $visit->visit_data,
            ]
        ]);
    }

    /**
     * Calcular distancia entre dos puntos usando fórmula de Haversine
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Radio de la Tierra en kilómetros

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c; // Distancia en kilómetros
    }
}
