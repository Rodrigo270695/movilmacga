<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Exports\PdvChangeRequestsExport;
use App\Models\PdvChangeRequest;
use App\Traits\HasBusinessScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Inertia\Response;

class PdvChangeRequestController extends Controller
{
    use HasBusinessScope;

    /**
     * Display a listing of PDV change requests.
     */
    public function index(Request $request): Response
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-pdv-aprobaciones-ver')) {
            abort(403, 'No tienes permisos para ver las aprobaciones de cambios PDV.');
        }

        // Obtener parámetros de filtrado y paginación
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $statusFilter = $request->get('status', '');
        $zonalFilter = $request->get('zonal', '');

        // Query base con relaciones (incluyendo route y circuit para mostrar en la columna zonal)
        $query = PdvChangeRequest::with([
            'pdv:id,point_name,client_name,address,reference,latitude,longitude,route_id',
            'pdv.route:id,name,code,circuit_id',
            'pdv.route.circuit:id,name,code,zonal_id',
            'user:id,first_name,last_name,email',
            'zonal:id,name,business_id',
            'zonal.business:id,name'
        ]);

        // Aplicar filtros de scope (zonal)
        $query = $this->applyZonalScope($query, 'zonal_id');

        // Filtro por estado
        if ($statusFilter && in_array($statusFilter, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $statusFilter);
        }

        // Filtro por zonal
        if ($zonalFilter && $zonalFilter !== 'all') {
            $query->where('zonal_id', $zonalFilter);
        }

        // Búsqueda
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('pdv', function ($subQuery) use ($search) {
                    $subQuery->where('point_name', 'like', "%{$search}%")
                        ->orWhere('client_name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                })
                ->orWhereHas('user', function ($subQuery) use ($search) {
                    $subQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('zonal', function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Ordenar por fecha de creación (más recientes primero)
        $changeRequests = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Obtener zonales disponibles para el filtro (según scope del usuario)
        $availableZonals = $this->getAvailableZonals();

        // Estadísticas
        $statsQuery = PdvChangeRequest::query();
        $statsQuery = $this->applyZonalScope($statsQuery, 'zonal_id');

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'pending' => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $statsQuery)->where('status', 'rejected')->count(),
        ];

        return Inertia::render('dcs/pdv-change-requests/index', [
            'changeRequests' => $changeRequests,
            'availableZonals' => $availableZonals,
            'stats' => $stats,
            'businessScope' => $this->getBusinessScope(),
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'zonal' => $zonalFilter,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Export change requests to Excel applying current filters and scopes.
     */
    public function export(Request $request)
    {
        $search = $request->get('search', '');
        $statusFilter = $request->get('status', '');
        $zonalFilter = $request->get('zonal', '');

        $query = PdvChangeRequest::with([
            'pdv:id,point_name,client_name,address,reference,latitude,longitude,route_id',
            'pdv.route:id,name,code,circuit_id',
            'pdv.route.circuit:id,name,code,zonal_id',
            'pdv.route.circuit.zonal:id,name,business_id',
            'pdv.route.circuit.zonal.business:id,name',
            'user:id,first_name,last_name,email'
        ]);

        $query = $this->applyZonalScope($query, 'zonal_id');

        if ($statusFilter && in_array($statusFilter, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $statusFilter);
        }

        if ($zonalFilter && $zonalFilter !== 'all') {
            $query->where('zonal_id', $zonalFilter);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('pdv', function ($subQuery) use ($search) {
                    $subQuery->where('point_name', 'like', "%{$search}%")
                        ->orWhere('client_name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                })
                ->orWhereHas('user', function ($subQuery) use ($search) {
                    $subQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('zonal', function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        $changeRequests = $query->orderBy('created_at', 'desc')->get();

        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "solicitudes_cambio_pdv_{$timestamp}.xlsx";

        Log::info('Exportando solicitudes de cambio PDV', [
            'user_id' => auth()->id(),
            'total' => $changeRequests->count(),
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'zonal' => $zonalFilter,
            ]
        ]);

        return Excel::download(new PdvChangeRequestsExport($changeRequests), $filename);
    }

    /**
     * Approve a change request.
     */
    public function approve(Request $request, PdvChangeRequest $changeRequest)
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-pdv-aprobaciones-aprobar')) {
            return back()->with('error', 'No tienes permisos para aprobar solicitudes.');
        }

        // Verificar que la solicitud esté pendiente
        if (!$changeRequest->is_pending) {
            return back()->with('error', 'Esta solicitud ya fue procesada.');
        }

        // Verificar que el supervisor tenga acceso al zonal de esta solicitud
        if (!$this->canAccessZonal($changeRequest->zonal_id)) {
            return back()->with('error', 'No tienes permisos para aprobar solicitudes de este zonal.');
        }

        try {
            DB::beginTransaction();

            // Recargar la solicitud con la relación del PDV
            $changeRequest->load('pdv');

            // IMPORTANTE: Guardar los cambios originales ANTES de aprobar
            // porque después de approve() y refresh() pueden perderse
            // Obtener directamente desde la base de datos para asegurar que tenemos el valor correcto
            $originalChangesRaw = DB::table('pdv_change_requests')
                ->where('id', $changeRequest->id)
                ->value('changes');

            $originalChanges = [];
            if ($originalChangesRaw) {
                if (is_string($originalChangesRaw)) {
                    $originalChanges = json_decode($originalChangesRaw, true) ?? [];
                } else {
                    $originalChanges = $originalChangesRaw;
                }
            }

            // Aprobar la solicitud PRIMERO (esto debe guardarse siempre)
            $approved = $changeRequest->approve();

            if (!$approved) {
                DB::rollBack();
                return back()->with('error', 'No se pudo aprobar la solicitud. Verifica que esté en estado pendiente.');
            }

            // Hacer commit de la aprobación primero
            DB::commit();

            // Ahora intentar aplicar los cambios (sin transacción, para que la aprobación ya esté guardada)
            try {
                // Recargar la solicitud para obtener el estado actualizado
                $changeRequest->refresh();
                $changeRequest->load('pdv');

                // Usar los cambios originales guardados antes de aprobar
                $changesApplied = $changeRequest->applyChanges($originalChanges);

                if ($changesApplied) {
                    \Log::info('PdvChangeRequest: Solicitud aprobada y cambios aplicados', [
                        'request_id' => $changeRequest->id,
                        'pdv_id' => $changeRequest->pdv_id,
                        'changes' => $originalChanges
                    ]);
                    return back()->with('success', 'Solicitud aprobada y cambios aplicados exitosamente.');
                } else {
                    // Si no hay cambios para aplicar, igual la aprobación se guardó
                    \Log::info('PdvChangeRequest: Solicitud aprobada (sin cambios para aplicar)', [
                        'request_id' => $changeRequest->id,
                        'pdv_id' => $changeRequest->pdv_id,
                        'changes' => $originalChanges
                    ]);
                    return back()->with('success', 'Solicitud aprobada exitosamente.');
                }
            } catch (\Exception $e) {
                // Si falla aplicar cambios, la aprobación ya está guardada
                \Log::error('PdvChangeRequest: Error al aplicar cambios (pero aprobación guardada)', [
                    'request_id' => $changeRequest->id,
                    'pdv_id' => $changeRequest->pdv_id,
                    'error' => $e->getMessage()
                ]);
                return back()->with('warning', 'Solicitud aprobada, pero hubo un problema al aplicar algunos cambios. Revisa los logs.');
            }

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('PdvChangeRequest: Error al aprobar solicitud', [
                'request_id' => $changeRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Error al aprobar la solicitud: ' . $e->getMessage());
        }
    }

    /**
     * Reject a change request.
     */
    public function reject(Request $request, PdvChangeRequest $changeRequest)
    {
        // Validar permisos
        if (!auth()->user()->can('gestor-pdv-aprobaciones-rechazar')) {
            return back()->with('error', 'No tienes permisos para rechazar solicitudes.');
        }

        // Verificar que la solicitud esté pendiente
        if (!$changeRequest->is_pending) {
            return back()->with('error', 'Esta solicitud ya fue procesada.');
        }

        // Verificar que el supervisor tenga acceso al zonal de esta solicitud
        if (!$this->canAccessZonal($changeRequest->zonal_id)) {
            return back()->with('error', 'No tienes permisos para rechazar solicitudes de este zonal.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        try {
            $changeRequest->reject($validated['rejection_reason'] ?? null);

            return back()->with('success', 'Solicitud rechazada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al rechazar la solicitud: ' . $e->getMessage());
        }
    }

    /**
     * Verificar si el usuario puede acceder a un zonal específico
     */
    private function canAccessZonal(int $zonalId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $zonalIds = $this->getZonalIds();
        return in_array($zonalId, $zonalIds);
    }
}
