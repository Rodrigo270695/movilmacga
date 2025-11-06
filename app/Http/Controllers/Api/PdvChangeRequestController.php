<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pdv;
use App\Models\PdvChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PdvChangeRequestController extends Controller
{
    /**
     * Crear una solicitud de cambio de PDV desde la app móvil
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pdv_id' => 'required|exists:pdvs,id',
            'address' => 'nullable|string|max:500',
            'reference' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $pdv = Pdv::with('route.circuit.zonal')->findOrFail($validated['pdv_id']);

        // Validar que se haya enviado al menos un campo para cambiar
        $hasChanges = false;
        $changes = [];

        if (isset($validated['address'])) {
            $hasChanges = true;
            $changes['address'] = $validated['address'];
        }

        if (isset($validated['reference'])) {
            $hasChanges = true;
            $changes['reference'] = $validated['reference'];
        }

        // Validar que si hay latitude, también haya longitude (y viceversa)
        if (isset($validated['latitude']) || isset($validated['longitude'])) {
            if (!isset($validated['latitude']) || !isset($validated['longitude'])) {
                throw ValidationException::withMessages([
                    'coordinates' => ['Debes proporcionar tanto la coordenada X (latitude) como Y (longitude).'],
                ]);
            }
            $hasChanges = true;
            $changes['latitude'] = (float) $validated['latitude'];
            $changes['longitude'] = (float) $validated['longitude'];
        }

        if (!$hasChanges) {
            throw ValidationException::withMessages([
                'changes' => ['Debes proporcionar al menos un campo para cambiar (dirección, referencia o coordenadas).'],
            ]);
        }

        // Obtener el zonal_id desde la relación del PDV
        $zonalId = null;
        if ($pdv->route && $pdv->route->circuit && $pdv->route->circuit->zonal) {
            $zonalId = $pdv->route->circuit->zonal->id;
        }

        if (!$zonalId) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo determinar el zonal del PDV. El PDV debe estar asignado a una ruta con circuito y zonal.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Obtener datos originales del PDV
            // Asegurar que las coordenadas sean números (pueden venir como string desde decimal)
            $originalData = [
                'address' => $pdv->address,
                'reference' => $pdv->reference,
                'latitude' => $pdv->latitude !== null ? (float) $pdv->latitude : null,
                'longitude' => $pdv->longitude !== null ? (float) $pdv->longitude : null,
            ];

            // Crear la solicitud
            $changeRequest = PdvChangeRequest::create([
                'pdv_id' => $pdv->id,
                'user_id' => $user->id,
                'zonal_id' => $zonalId,
                'status' => 'pending',
                'original_data' => $originalData,
                'changes' => $changes,
                'reason' => $validated['reason'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Solicitud de cambio creada exitosamente. Esperando aprobación del supervisor.',
                'data' => [
                    'change_request_id' => $changeRequest->id,
                    'pdv_id' => $changeRequest->pdv_id,
                    'status' => $changeRequest->status,
                    'status_label' => $changeRequest->status_label,
                    'changes' => $changeRequest->changes,
                    'created_at' => $changeRequest->created_at->toIso8601String(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la solicitud de cambio',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener las solicitudes de cambio del usuario actual
     */
    public function myRequests(Request $request)
    {
        $user = $request->user();

        $requests = PdvChangeRequest::where('user_id', $user->id)
            ->with([
                'pdv:id,point_name,client_name',
                'zonal:id,name'
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'pdv_id' => $request->pdv_id,
                    'pdv_name' => $request->pdv->point_name,
                    'zonal_name' => $request->zonal->name,
                    'status' => $request->status,
                    'status_label' => $request->status_label,
                    'changes' => $request->changes,
                    'reason' => $request->reason,
                    'rejection_reason' => $request->rejection_reason,
                    'created_at' => $request->created_at->toIso8601String(),
                    'approved_at' => $request->approved_at?->toIso8601String(),
                    'rejected_at' => $request->rejected_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }
}
