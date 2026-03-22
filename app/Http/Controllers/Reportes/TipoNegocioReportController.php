<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\DCS\NegocioOperadorController;
use App\Http\Requests\DCS\NegocioOperadorSyncRequest;
use App\Models\Operator;
use App\Models\Pdv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TipoNegocioReportController extends NegocioOperadorController
{
    /**
     * Reporte Tipo de negocio: mismos criterios de filtro que {@see NegocioOperadorController::index}
     * (negocio, zonal, circuito, ruta; vendedor con rutas del día).
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isVendor = $user->hasRole('Vendedor');

        $requestForQuery = $this->requestWithVendorDefaults($request, $user, $isVendor);

        if ($isVendor) {
            $opts = $this->filterOptionsForVendor($user);
            $businesses = [];
            $allZonalesArr = $opts['allZonales'];
            $allCircuits = $opts['allCircuits'];
            $allRoutes = $opts['allRoutes'];
        } else {
            $opts = $this->filterOptionsForStaff();
            $businesses = $opts['businesses'];
            $allZonalesArr = $opts['allZonales'];
            $allCircuits = $opts['allCircuits'];
            $allRoutes = $opts['allRoutes'];
        }

        $requestedBusinessType = $request->get('business_type');
        $businessTypeSanitized = null;
        if (
            is_string($requestedBusinessType)
            && $requestedBusinessType !== ''
            && in_array($requestedBusinessType, NegocioOperadorSyncRequest::businessTypeValues(), true)
        ) {
            $businessTypeSanitized = $requestedBusinessType;
        }

        return Inertia::render('reportes/tipo-de-negocio/index', [
            'businesses' => $businesses,
            'allZonales' => $allZonalesArr,
            'allCircuits' => $allCircuits instanceof \Illuminate\Support\Collection ? $allCircuits->values()->toArray() : $allCircuits,
            'allRoutes' => $allRoutes instanceof \Illuminate\Support\Collection ? $allRoutes->values()->toArray() : $allRoutes,
            'businessTypeOptions' => $this->businessTypeOptionsForFrontend(),
            'isVendor' => $isVendor,
            'visitDateTodayFormatted' => $this->todayDateFormattedPeru(),
            'filters' => [
                'business_id' => $isVendor ? null : $request->get('business_id'),
                'zonal_id' => $requestForQuery->get('zonal_id'),
                'circuit_id' => $requestForQuery->get('circuit_id'),
                'route_id' => $requestForQuery->get('route_id'),
                'business_type' => $businessTypeSanitized,
            ],
            'flash' => fn () => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * JSON para el mapa del reporte: PDVs con coordenadas y filas de pdv_business_type_operators (activas).
     */
    public function mapData(Request $request)
    {
        if (! Auth::user()?->can('reporte-tipo-negocio-ver')) {
            abort(403, 'No tienes permisos para ver el mapa.');
        }

        $user = Auth::user();
        $isVendor = $user->hasRole('Vendedor');
        $requestForQuery = $this->requestWithVendorDefaults($request, $user, $isVendor);

        $bt = $requestForQuery->get('business_type');
        if (! is_string($bt) || $bt === '' || ! in_array($bt, NegocioOperadorSyncRequest::businessTypeValues(), true)) {
            $queryParams = $requestForQuery->query->all();
            unset($queryParams['business_type']);
            $requestForQuery = $requestForQuery->duplicate($queryParams);
        }

        $query = $this->pdvsMapQueryBusinessTypes($requestForQuery, $user, $isVendor);
        $pdvs = $query->orderBy('point_name')->get();

        $payload = $pdvs->map(function (Pdv $pdv) {
            $rows = [];
            foreach ($pdv->pdvBusinessTypes as $pbt) {
                foreach ($pbt->businessTypeOperators as $bto) {
                    if (! $bto->status) {
                        continue;
                    }
                    $op = $bto->operator;
                    if (! $op) {
                        continue;
                    }
                    $rows[] = [
                        'operator_id' => $op->id,
                        'name' => $op->name,
                        'color' => $op->color,
                        'sale_mode' => $bto->sale_mode,
                        'business_type' => $pbt->business_type,
                    ];
                }
            }

            $zonal = $pdv->route?->circuit?->zonal;

            return [
                'id' => $pdv->id,
                'point_name' => $pdv->point_name,
                'client_name' => $pdv->client_name,
                'latitude' => $pdv->latitude,
                'longitude' => $pdv->longitude,
                'zonal_id' => $zonal?->id,
                'zonal_name' => $zonal?->name,
                'bt_operators' => $rows,
            ];
        })->values();

        $operators = Operator::active()
            ->orderByRaw("CASE WHEN LOWER(name) = 'movistar' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return response()->json([
            'pdvs' => $payload,
            'operators' => $operators,
        ]);
    }
}
