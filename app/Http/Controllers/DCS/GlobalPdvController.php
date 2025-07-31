<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\PdvRequest;
use App\Models\Pdv;
use App\Models\Route;
use App\Models\Localidad;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GlobalPdvController extends Controller
{
        /**
     * Generate a unique 6-digit POS ID
     */
    private function generateUniquePosId(): string
    {
        $maxAttempts = 100; // Evitar bucles infinitos
        $attempts = 0;

        do {
            // Generar un número de 6 dígitos (100000 - 999999)
            $posId = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Verificar que no exista en la base de datos
            $exists = Pdv::where('pos_id', $posId)->exists();
            $attempts++;

            // Failsafe: si llegamos al límite de intentos, usar timestamp
            if ($attempts >= $maxAttempts) {
                $posId = substr(str_replace('.', '', microtime(true)), -6);
                break;
            }

        } while ($exists);

        return $posId;
    }

    /**
     * Display a global listing of PDVs with filters.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!Auth::user()->can('gestor-pdv-ver')) {
            abort(403, 'No tienes permisos para ver los PDVs.');
        }

        $perPage = $request->get('per_page', 10);

        // Filtros básicos
        $searchFilter = $request->get('search');
        $routeFilter = $request->get('route_id');
        $localityFilter = $request->get('locality_id');
        $statusFilter = $request->get('status');
        $classificationFilter = $request->get('classification');

        // Filtros avanzados
        $documentTypeFilter = $request->get('document_type');
        $sellsRechargeFilter = $request->get('sells_recharge');
        $circuitFilter = $request->get('circuit_id');
        $documentNumberFilter = $request->get('document_number');
        $clientNameFilter = $request->get('client_name');
        $pointNameFilter = $request->get('point_name');
        $posIdFilter = $request->get('pos_id');

        $query = Pdv::with(['route.circuit.zonal', 'locality'])
            ->select('id', 'point_name', 'pos_id', 'document_type', 'document_number', 'client_name', 'classification', 'status', 'route_id', 'locality_id', 'sells_recharge', 'created_at');

        // Búsqueda general (search)
        if ($searchFilter) {
            $query->where(function ($q) use ($searchFilter) {
                $q->where('point_name', 'like', "%{$searchFilter}%")
                  ->orWhere('client_name', 'like', "%{$searchFilter}%")
                  ->orWhere('document_number', 'like', "%{$searchFilter}%")
                  ->orWhere('pos_id', 'like', "%{$searchFilter}%")
                  ->orWhereHas('locality', function ($locQuery) use ($searchFilter) {
                      $locQuery->where('name', 'like', "%{$searchFilter}%");
                  })
                  ->orWhereHas('route', function ($routeQuery) use ($searchFilter) {
                      $routeQuery->where('name', 'like', "%{$searchFilter}%")
                                 ->orWhere('code', 'like', "%{$searchFilter}%");
                  });
            });
        }

        // Filtros básicos
        if ($routeFilter) {
            $query->byRoute($routeFilter);
        }

        if ($localityFilter) {
            $query->byLocality($localityFilter);
        }

        if ($statusFilter) {
            $query->byStatus($statusFilter);
        }

        if ($classificationFilter) {
            $query->byClassification($classificationFilter);
        }

        // Filtros avanzados específicos
        if ($documentTypeFilter) {
            $query->where('document_type', $documentTypeFilter);
        }

        if ($sellsRechargeFilter !== null && $sellsRechargeFilter !== '') {
            $query->where('sells_recharge', $sellsRechargeFilter === '1' ? true : false);
        }

        if ($circuitFilter) {
            $query->whereHas('route', function ($routeQuery) use ($circuitFilter) {
                $routeQuery->where('circuit_id', $circuitFilter);
            });
        }

        if ($documentNumberFilter) {
            $query->where('document_number', 'like', "%{$documentNumberFilter}%");
        }

        if ($clientNameFilter) {
            $query->where('client_name', 'like', "%{$clientNameFilter}%");
        }

        if ($pointNameFilter) {
            $query->where('point_name', 'like', "%{$pointNameFilter}%");
        }

        if ($posIdFilter) {
            $query->where('pos_id', 'like', "%{$posIdFilter}%");
        }

        $pdvs = $query->orderBy('point_name')->paginate($perPage);

        // Cargar datos para los filtros y formularios
        $circuits = \App\Models\Circuit::active()->with('zonal')->orderBy('name')->get(['id', 'name', 'code', 'zonal_id']);
        $routes = Route::active()->with('circuit.zonal')->orderBy('name')->get(['id', 'name', 'code', 'circuit_id']);
        $departamentos = \App\Models\Departamento::where('status', true)->orderBy('name')->get(['id', 'name', 'pais_id']);
        // REMOVIDO: Carga masiva de provincias, distritos y localidades
        // Solo cargar departamentos inicialmente, el resto se carga dinámicamente

        return Inertia::render('dcs/pdvs/global-index', [
            'pdvs' => $pdvs,
            'circuits' => $circuits,
            'routes' => $routes,
            'departamentos' => $departamentos,
            // REMOVIDO: 'provincias', 'distritos', 'localities'
            'filters' => [
                'search' => $searchFilter,
                'route_id' => $routeFilter,
                'locality_id' => $localityFilter,
                'status' => $statusFilter,
                'classification' => $classificationFilter,
                'document_type' => $documentTypeFilter,
                'sells_recharge' => $sellsRechargeFilter,
                'circuit_id' => $circuitFilter,
                'document_number' => $documentNumberFilter,
                'client_name' => $clientNameFilter,
                'point_name' => $pointNameFilter,
                'pos_id' => $posIdFilter,
            ],
            'flash' => fn () => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Obtener provincias por departamento (AJAX)
     */
    public function getProvinciasByDepartamento(Request $request)
    {
        $departamentoId = $request->input('departamento_id');

        if (!$departamentoId) {
            return response()->json([]);
        }

        $provincias = \App\Models\Provincia::where('status', true)
            ->where('departamento_id', $departamentoId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($provincias);
    }

    /**
     * Obtener distritos por provincia (AJAX)
     */
    public function getDistritosByProvincia(Request $request)
    {
        $provinciaId = $request->input('provincia_id');

        if (!$provinciaId) {
            return response()->json([]);
        }

        $distritos = \App\Models\Distrito::where('status', true)
            ->where('provincia_id', $provinciaId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($distritos);
    }

    /**
     * Buscar localidades por distrito con filtro de texto (AJAX)
     */
    public function searchLocalidades(Request $request)
    {
        $distritoId = $request->input('distrito_id');
        $search = $request->input('search', '');

        if (!$distritoId) {
            return response()->json([]);
        }

        $query = Localidad::where('status', true)
            ->where('distrito_id', $distritoId);

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        // Limitar a 50 resultados para evitar sobrecarga
        $localidades = $query->orderBy('name')
            ->limit(50)
            ->get(['id', 'name']);

        return response()->json($localidades);
    }

    /**
     * Obtener rutas por circuito (AJAX)
     */
    public function getRoutesByCircuit(Request $request)
    {
        $circuitId = $request->input('circuit_id');

        if (!$circuitId) {
            return response()->json([]);
        }

        $routes = Route::active()
            ->where('circuit_id', $circuitId)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json($routes);
    }

    /**
     * Store a newly created resource in storage (global).
     */
    public function store(PdvRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-crear')) {
            abort(403, 'No tienes permisos para crear PDVs.');
        }

        // Generar POS ID automáticamente
        $posId = $this->generateUniquePosId();

        $pdv = Pdv::create([
            'point_name' => $request->point_name,
            'pos_id' => $posId,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'client_name' => $request->client_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'sells_recharge' => $request->sells_recharge ?? false,
            'classification' => $request->classification,
            'status' => $request->status,
            'address' => $request->address,
            'reference' => $request->reference,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'route_id' => $request->route_id,
            'locality_id' => $request->locality_id,
        ]);

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdv->point_name}' creado exitosamente con POS ID: {$pdv->pos_id}");
    }

    /**
     * Update the specified resource in storage (global).
     */
    public function update(PdvRequest $request, Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-editar')) {
            abort(403, 'No tienes permisos para editar PDVs.');
        }

        // Mantener el pos_id existente durante la edición
        $posId = $pdv->pos_id;

        $pdv->update([
            'point_name' => $request->point_name,
            'pos_id' => $posId,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'client_name' => $request->client_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'sells_recharge' => $request->sells_recharge ?? false,
            'classification' => $request->classification,
            'status' => $request->status,
            'address' => $request->address,
            'reference' => $request->reference,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'route_id' => $request->route_id,
            'locality_id' => $request->locality_id,
        ]);

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdv->point_name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource (global).
     */
    public function toggleStatus(Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de PDVs.');
        }

        // Determinar nuevo status (ciclar entre los estados principales)
        $newStatus = match($pdv->status) {
            'vende' => 'no vende',
            'no vende' => 'vende',
            default => 'vende'
        };

        // Hacer el update
        $pdv->status = $newStatus;
        $pdv->save();

        $statusText = $pdv->status_label;

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "PDV estado cambiado a '{$statusText}' exitosamente.");
        }

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV estado cambiado a '{$statusText}' exitosamente.");
    }

    /**
     * Remove the specified resource from storage (global).
     */
    public function destroy(Pdv $pdv)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-pdv-eliminar')) {
            abort(403, 'No tienes permisos para eliminar PDVs.');
        }

        $pdvName = $pdv->point_name;
        $pdv->delete();

        return redirect()->route('dcs.pdvs.index')
            ->with('success', "PDV '{$pdvName}' eliminado exitosamente.");
    }
}
