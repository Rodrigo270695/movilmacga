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
        // Obtener filtros de la request con valores por defecto del día actual en Perú
        $fechaDesde = $request->get('fecha_desde', now()->format('Y-m-d'));
        $fechaHasta = $request->get('fecha_hasta', now()->format('Y-m-d'));
        $vendedorId = $request->get('vendedor_id');
        $pdvId = $request->get('pdv_id');
        $estado = $request->get('estado');
        $businessId = $request->get('business_id');
        $zonalId = $request->get('zonal_id');
        $circuitId = $request->get('circuit_id');
        $routeId = $request->get('route_id');

        // Query base para obtener visitas con relaciones completas
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

        // Aplicar filtros avanzados
        if ($vendedorId && $vendedorId !== 'todos') {
            $query->where('user_id', $vendedorId);
        }

        if ($pdvId && $pdvId !== 'todos') {
            $query->where('pdv_id', $pdvId);
        }

        if ($estado && $estado !== 'todos') {
            $query->where('visit_status', $estado);
        }

        // Filtros por jerarquía organizacional
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

        // Obtener datos paginados
        $visitas = $query->orderBy('check_in_at', 'desc')
                        ->paginate(25)
                        ->withQueryString();



        // Datos para filtros jerárquicos (aplicando scope)
        $businesses = $this->getAvailableBusinesses();

        // Zonales filtrados por scope y negocio seleccionado
        $zonalesQuery = \App\Models\Zonal::with('business')->orderBy('name');
        $zonalesQuery = $this->applyZonalBusinessScope($zonalesQuery);
        if ($businessId && $businessId !== 'todos') {
            $zonalesQuery->where('business_id', $businessId);
        }
        $zonales = $zonalesQuery->get(['id', 'name', 'business_id']);

        // Circuitos filtrados por scope y zonal seleccionado
        $circuitsQuery = \App\Models\Circuit::with('zonal.business')->orderBy('name');
        $circuitsQuery = $this->applyFullScope($circuitsQuery, 'zonal.business', 'zonal');
        if ($zonalId && $zonalId !== 'todos') {
            $circuitsQuery->where('zonal_id', $zonalId);
        }
        $circuits = $circuitsQuery->get(['id', 'name', 'code', 'zonal_id']);

        // Rutas filtradas por scope y circuito seleccionado
        $routesQuery = \App\Models\Route::with('circuit.zonal.business')->orderBy('name');
        $routesQuery = $this->applyFullScope($routesQuery, 'circuit.zonal.business', 'circuit.zonal');
        if ($circuitId && $circuitId !== 'todos') {
            $routesQuery->where('circuit_id', $circuitId);
        }
        $routes = $routesQuery->get(['id', 'name', 'circuit_id']);

        // Vendedores filtrados por scope - solo vendedores con asignaciones en zonales permitidos
        $vendedoresQuery = User::where('status', true)->orderBy('first_name');
        if ($this->hasZonalRestriction()) {
            $zonalIds = $this->getZonalIds();
            $vendedoresQuery->whereHas('activeUserCircuits.circuit.zonal', function($q) use ($zonalIds) {
                $q->whereIn('id', $zonalIds);
            });
        }
        $vendedores = $vendedoresQuery->get(['id', 'first_name', 'last_name', 'username']);

        // PDVs filtrados por scope y ruta seleccionada
        $pdvsQuery = Pdv::with('route.circuit.zonal.business')->orderBy('point_name');
        $pdvsQuery = $this->applyFullScope($pdvsQuery, 'route.circuit.zonal.business', 'route.circuit.zonal');
        if ($routeId && $routeId !== 'todos') {
            $pdvsQuery->where('route_id', $routeId);
        }
        $pdvs = $pdvsQuery->get(['id', 'point_name', 'client_name', 'route_id']);

        return Inertia::render('reportes/pdvs-visitados/index', [
            'visitas' => $visitas,
            'filtros' => [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'vendedor_id' => $vendedorId,
                'pdv_id' => $pdvId,
                'estado' => $estado,
                'business_id' => $businessId,
                'zonal_id' => $zonalId,
                'circuit_id' => $circuitId,
                'route_id' => $routeId,
            ],
            'opciones' => [
                'businesses' => $businesses,
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
