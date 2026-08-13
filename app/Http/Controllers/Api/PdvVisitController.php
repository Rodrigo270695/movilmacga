<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Geofence;
use App\Models\Pdv;
use App\Models\PdvVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PdvVisitController extends Controller
{
    /**
     * Valores por defecto cuando el PDV no tiene un negocio resuelto
     * (cadena Pdv->Route->Circuit->Zonal->Business incompleta).
     */
    private const DEFAULT_MAX_DISTANCE_METERS = 20;
    private const DEFAULT_MIN_DURATION_MINUTES = 10;
    private const DEFAULT_MAX_VISITS_PER_PDV_PER_DAY = 2;

    /**
     * Obtiene la configuración de visita (distancia máxima, tiempo mínimo
     * para finalizar y máximo de visitas al mismo PDV por día) según el
     * negocio (Business/marca) al que pertenece el PDV.
     */
    public function visitSettings(Request $request, Pdv $pdv)
    {
        $business = $pdv->resolvedBusiness();
        $todayDate = now()->toDateString();
        $visitsTodayCount = PdvVisit::where('user_id', $request->user()->id)
            ->where('pdv_id', $pdv->id)
            ->whereDate('check_in_at', $todayDate)
            ->where('visit_status', 'completed')
            ->count();
        $maxVisitsPerDay = $business?->max_visits_per_pdv_per_day ?? self::DEFAULT_MAX_VISITS_PER_PDV_PER_DAY;

        return response()->json([
            'success' => true,
            'data' => [
                'business_id' => $business?->id,
                'business_name' => $business?->name,
                'max_distance_meters' => $business?->max_visit_distance_meters ?? self::DEFAULT_MAX_DISTANCE_METERS,
                'min_duration_minutes' => $business?->min_visit_duration_minutes ?? self::DEFAULT_MIN_DURATION_MINUTES,
                'max_visits_per_pdv_per_day' => $maxVisitsPerDay,
                'visits_today_count' => $visitsTodayCount,
                'can_start_visit' => $visitsTodayCount < $maxVisitsPerDay,
            ]
        ]);
    }

    /**
     * Hacer check-in en un PDV
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'pdv_id' => 'required|exists:pdvs,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_mock_location' => 'nullable|boolean',
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

        // Verificar que no haya superado el máximo de visitas a este PDV hoy
        // (configurable por marca; por defecto 2).
        $maxVisitsPerDay = $pdv->resolvedBusiness()?->max_visits_per_pdv_per_day
            ?? self::DEFAULT_MAX_VISITS_PER_PDV_PER_DAY;

        $todayCompletedCount = PdvVisit::where('user_id', $user->id)
            ->where('pdv_id', $pdv->id)
            ->whereDate('check_in_at', now()->toDateString())
            ->where('visit_status', 'completed')
            ->count();

        if ($todayCompletedCount >= $maxVisitsPerDay) {
            return response()->json([
                'success' => false,
                'message' => "Ya alcanzaste el máximo de {$maxVisitsPerDay} visitas a este PDV hoy.",
                'data' => [
                    'visits_today_count' => $todayCompletedCount,
                    'max_visits_per_day' => $maxVisitsPerDay,
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

        if (is_null($pdv->latitude) || is_null($pdv->longitude)) {
            return response()->json([
                'success' => false,
                'message' => 'El PDV no tiene coordenadas configuradas. Contacta al administrador.',
            ], 409);
        }

        // Calcular distancia al PDV
        $distanceToPdv = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $pdv->latitude,
            $pdv->longitude
        );

        $distanceToPdvMeters = round($distanceToPdv * 1000, 2);

        $geofence = Geofence::where('pdv_id', $pdv->id)
            ->where('is_active', true)
            ->first();

        $distanceToGeofenceMeters = null;
        $geofenceRadiusMeters = null;

        if ($geofence) {
            $geofenceDistance = $this->calculateDistance(
                $request->latitude,
                $request->longitude,
                $geofence->center_latitude,
                $geofence->center_longitude
            );

            $distanceToGeofenceMeters = round($geofenceDistance * 1000, 2);
            $geofenceRadiusMeters = (float) $geofence->radius_meters;
            $isWithinGeofence = $distanceToGeofenceMeters <= $geofenceRadiusMeters;
        } else {
            $defaultRadiusMeters = (float) config('tracking.default_check_in_radius_meters', 150);
            $distanceToGeofenceMeters = $distanceToPdvMeters;
            $geofenceRadiusMeters = $defaultRadiusMeters;
            $isWithinGeofence = $distanceToGeofenceMeters <= $defaultRadiusMeters;
        }

        try {
            DB::beginTransaction();

            $usedMockLocation = $request->boolean('is_mock_location');

            $visit = PdvVisit::create([
                'user_id' => $user->id,
                'pdv_id' => $pdv->id,
                'check_in_at' => now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'distance_to_pdv' => $distanceToPdvMeters,
                'notes' => $request->notes,
                'visit_status' => 'in_progress',
                'is_valid' => $isWithinGeofence, // Marcar como válida si está dentro del geofence
                'used_mock_location' => $usedMockLocation,
                'visit_data' => [
                    'check_in_device_info' => [
                        'user_agent' => $request->userAgent(),
                        'ip' => $request->ip(),
                    ],
                    'location_validation' => [
                        'is_mock_location' => $usedMockLocation,
                    ],
                    'geofence_validation' => [
                        'within_geofence' => $isWithinGeofence,
                        'distance_to_geofence_meters' => $distanceToGeofenceMeters,
                        'geofence_radius_meters' => $geofenceRadiusMeters,
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
                'used_mock_location' => $visit->used_mock_location,
                    'distance_to_geofence_meters' => $distanceToGeofenceMeters,
                    'geofence_radius_meters' => $geofenceRadiusMeters,
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
            'visit_id' => 'required|integer',
            'notes' => 'nullable|string|max:500',
            'visit_data' => 'nullable|array', // Datos adicionales del formulario
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_mock_location' => 'nullable|boolean',
            // PDV cerrado: permite finalizar sin cumplir el tiempo mínimo,
            // siempre que se deje evidencia (foto + observación).
            'pdv_closed' => 'nullable|boolean',
            'closed_reason' => 'required_if:pdv_closed,true|nullable|string|max:500',
        ]);

        $user = $request->user();
        $visit = PdvVisit::where('id', $request->visit_id)
            ->where('user_id', $user->id)
            ->first();

        // Si el ID que manda la app ya no está en curso (visita anterior del
        // mismo día, ID desactualizado, etc.), usar la visita in_progress real.
        if (!$visit || $visit->visit_status !== 'in_progress') {
            $pdvId = $visit?->pdv_id;
            $visit = PdvVisit::where('user_id', $user->id)
                ->where('visit_status', 'in_progress')
                ->when($pdvId, fn ($query) => $query->where('pdv_id', $pdvId))
                ->latest('check_in_at')
                ->first();
        }

        if (!$visit) {
            $visit = PdvVisit::where('user_id', $user->id)
                ->where('visit_status', 'in_progress')
                ->latest('check_in_at')
                ->first();
        }

        if (!$visit) {
            return response()->json([
                'success' => false,
                'message' => 'No hay una visita en curso para finalizar. Puede que ya se haya cerrado.',
            ], 400);
        }

        $pdvClosed = $request->boolean('pdv_closed');

        // Si se reporta el PDV como cerrado, se exige evidencia (foto ya
        // subida vía /pdv-visits/upload-photo) y una observación, pero se
        // omite la validación de tiempo mínimo: no tiene sentido esperar los
        // minutos configurados si el local está cerrado y no se puede
        // completar la visita.
        if ($pdvClosed) {
            if (empty($visit->visit_photo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debes capturar una foto de evidencia antes de finalizar la visita como "PDV cerrado".',
                ], 400);
            }
        } else {
            // Validar tiempo mínimo de visita (configurable por negocio). Esta
            // regla ya se aplica en la app móvil (deshabilita el botón), pero se
            // repite aquí para que no pueda saltarse llamando al API directo.
            $durationMinutesSoFar = now()->diffInMinutes($visit->check_in_at);
            $minDurationMinutes = $visit->pdv?->resolvedBusiness()?->min_visit_duration_minutes
                ?? self::DEFAULT_MIN_DURATION_MINUTES;

            if ($durationMinutesSoFar < $minDurationMinutes) {
                return response()->json([
                    'success' => false,
                    'message' => "Debes permanecer al menos {$minDurationMinutes} minutos en el PDV antes de finalizar la visita.",
                    'data' => [
                        'min_duration_minutes' => $minDurationMinutes,
                        'elapsed_minutes' => $durationMinutesSoFar,
                        'remaining_minutes' => $minDurationMinutes - $durationMinutesSoFar,
                    ]
                ], 400);
            }
        }

        try {
            DB::beginTransaction();

            $durationMinutes = now()->diffInMinutes($visit->check_in_at);

            $visitData = $visit->visit_data ?? [];
            $visitData = array_merge($visitData, [
                'check_out_device_info' => [
                    'user_agent' => $request->userAgent(),
                    'ip' => $request->ip(),
                ],
                'additional_data' => $request->visit_data ?? [],
            ]);

            if ($request->filled(['latitude', 'longitude'])) {
                $visitData['check_out_location'] = [
                    'latitude' => (float) $request->latitude,
                    'longitude' => (float) $request->longitude,
                    'recorded_at' => now(),
                    'is_mock_location' => $request->boolean('is_mock_location'),
                ];
            }

            if ($pdvClosed) {
                $visitData['pdv_closed_at'] = now();
            }

            $usedMockLocation = $visit->used_mock_location || $request->boolean('is_mock_location');

            // Si el PDV se reporta como cerrado, la observación ya viaja en
            // `closed_reason`; se evita duplicarla también como "Salida: ...".
            if ($pdvClosed) {
                $notes = trim($visit->notes . "\n\n🔒 PDV CERRADO: " . $request->closed_reason);
            } else {
                $notes = $visit->notes . ($request->notes ? "\n\nSalida: " . $request->notes : '');
            }

            $visit->update([
                'check_out_at' => now(),
                'visit_status' => 'completed',
                'duration_minutes' => $durationMinutes,
                'notes' => $notes,
                'used_mock_location' => $usedMockLocation,
                'visit_data' => $visitData,
                'pdv_closed' => $pdvClosed,
                'closed_reason' => $pdvClosed ? $request->closed_reason : null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $pdvClosed
                    ? 'Visita finalizada como "PDV cerrado". Evidencia registrada correctamente.'
                    : 'Check-out realizado exitosamente',
                'data' => [
                    'visit_id' => $visit->id,
                    'check_out_at' => $visit->check_out_at,
                    'duration_minutes' => $durationMinutes,
                    'status' => 'completed',
                    'pdv_closed' => $pdvClosed,
                    'used_mock_location' => $visit->used_mock_location,
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

        // Usar zona horaria de Perú explícitamente
        $todayPeru = now('America/Lima')->startOfDay();
        $tomorrowPeru = now('America/Lima')->copy()->addDay()->startOfDay();

        $visits = PdvVisit::with([
            'pdv:id,point_name,address,classification,status,route_id',
            'pdv.route:id,name,circuit_id',
            'pdv.route.circuit:id,name'
        ])
            ->where('user_id', $user->id)
            ->whereBetween('check_in_at', [$todayPeru, $tomorrowPeru])
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
                    'route' => [
                        'id' => $visit->pdv->route?->id,
                        'name' => $visit->pdv->route?->name ?? 'Sin ruta',
                    ],
                    'circuit' => [
                        'id' => $visit->pdv->route?->circuit?->id,
                        'name' => $visit->pdv->route?->circuit?->name ?? 'Sin circuito',
                    ],
                    'check_in_at' => $visit->check_in_at,
                    'check_out_at' => $visit->check_out_at,
                    'duration_minutes' => $visit->duration_minutes,
                    'distance_to_pdv_meters' => $visit->distance_to_pdv,
                    'visit_status' => $visit->visit_status,
                    'is_valid' => $visit->is_valid,
                    'used_mock_location' => $visit->used_mock_location,
                    'has_photo' => !is_null($visit->visit_photo),
                    'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                    'date' => $visit->check_in_at->setTimezone('America/Lima')->format('Y-m-d'),
                    'time' => $visit->check_in_at->setTimezone('America/Lima')->format('H:i'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'date' => now('America/Lima')->format('Y-m-d'),
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

        $baseQuery = PdvVisit::with([
            'pdv:id,point_name,address,classification,status,route_id',
            'pdv.route:id,name,circuit_id',
            'pdv.route.circuit:id,name'
        ])
        ->where('user_id', $user->id);

        // Filtros opcionales
        if ($request->has('status')) {
            $baseQuery->where('visit_status', $request->status);
        }

        // Usar zona horaria de Perú para filtros de fecha
        $dateFrom = $request->has('date_from')
            ? Carbon::parse($request->date_from, 'America/Lima')->startOfDay()
            : null;
        $dateTo = $request->has('date_to')
            ? Carbon::parse($request->date_to, 'America/Lima')->endOfDay()
            : null;

        if ($dateFrom && $dateTo) {
            $baseQuery->whereBetween('check_in_at', [$dateFrom, $dateTo]);
        } elseif ($dateFrom && !$dateTo) {
            $baseQuery->whereBetween('check_in_at', [$dateFrom, $dateFrom->copy()->endOfDay()]);
        } elseif (!$dateFrom && $dateTo) {
            $baseQuery->whereBetween('check_in_at', [$dateTo->copy()->startOfDay(), $dateTo]);
        }

        $filteredQueryForPagination = clone $baseQuery;

        $visits = $filteredQueryForPagination
            ->orderBy('check_in_at', 'desc')
            ->paginate($perPage);

        $mappedVisits = $visits->getCollection()
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
                    'route' => [
                        'id' => $visit->pdv->route?->id,
                        'name' => $visit->pdv->route?->name ?? 'Sin ruta',
                    ],
                    'circuit' => [
                        'id' => $visit->pdv->route?->circuit?->id,
                        'name' => $visit->pdv->route?->circuit?->name ?? 'Sin circuito',
                    ],
                    'check_in_at' => $visit->check_in_at,
                    'check_out_at' => $visit->check_out_at,
                    'duration_minutes' => $visit->duration_minutes,
                    'distance_to_pdv_meters' => $visit->distance_to_pdv,
                    'visit_status' => $visit->visit_status,
                    'is_valid' => $visit->is_valid,
                    'used_mock_location' => $visit->used_mock_location,
                    'has_photo' => !is_null($visit->visit_photo),
                    'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                    'notes' => $visit->notes,
                    'date' => $visit->check_in_at->setTimezone('America/Lima')->format('Y-m-d'),
                    'time' => $visit->check_in_at->setTimezone('America/Lima')->format('H:i'),
                ];
            })
            ->values();

        $summaryBaseQuery = clone $baseQuery;
        $completedCount = (clone $summaryBaseQuery)->where('visit_status', 'completed')->count();
        $inProgressCount = (clone $summaryBaseQuery)->where('visit_status', 'in_progress')->count();
        $cancelledCount = (clone $summaryBaseQuery)->where('visit_status', 'cancelled')->count();

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
                    'completed_visits' => $completedCount,
                    'in_progress_visits' => $inProgressCount,
                    'cancelled_visits' => $cancelledCount,
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

        $visit->load([
            'pdv:id,point_name,address,latitude,longitude,classification,status',
            'formResponsesWithFields.formField'
        ]);

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
                'used_mock_location' => $visit->used_mock_location,
                'notes' => $visit->notes,
                'photo_url' => $visit->visit_photo ? Storage::url($visit->visit_photo) : null,
                'visit_data' => $visit->visit_data,
                'form_responses' => $visit->formResponsesWithFields->map(function ($response) {
                    return [
                        'field_id' => $response->form_field_id,
                        'field_name' => $response->formField->name ?? null,
                        'field_type' => $response->formField->type ?? null,
                        'response_value' => $response->response_value,
                        'response_file' => $response->response_file ? Storage::url($response->response_file) : null,
                        'response_location' => $response->response_location,
                        'response_signature' => $response->response_signature ? Storage::url($response->response_signature) : null,
                    ];
                }),
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
     * Eliminar una visita (solo si está en progreso)
     */
    public function destroy(Request $request, PdvVisit $visit)
    {
        $user = $request->user();

        // Verificar que la visita pertenezca al usuario
        if ($visit->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta visita.',
            ], 403);
        }

        // Verificar que la visita esté en estado "in_progress"
        if ($visit->visit_status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar visitas que están en progreso.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Eliminar foto si existe
            if ($visit->visit_photo && Storage::disk('public')->exists($visit->visit_photo)) {
                Storage::disk('public')->delete($visit->visit_photo);
            }

            // Eliminar la visita
            $visit->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Visita eliminada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la visita',
                'error' => $e->getMessage()
            ], 500);
        }
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
