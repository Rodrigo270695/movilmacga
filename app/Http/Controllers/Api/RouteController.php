<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\Pdv;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RouteController extends Controller
{
    /**
     * Obtener los PDVs de una ruta específica
     */
    public function getPdvs(Request $request, Route $route): JsonResponse
    {
        try {
            // Verificar que el usuario esté autenticado
            if (!Auth::check()) {
                return response()->json([
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Obtener PDVs de la ruta con información relacionada
            $pdvs = $route->pdvs()
                ->with(['locality'])
                ->select([
                    'id',
                    'point_name',
                    'client_name',
                    'pos_id',
                    'address',
                    'latitude',
                    'longitude',
                    'status',
                    'locality_id'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'pdvs' => $pdvs,
                'route' => [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'circuit' => $route->circuit ? [
                        'id' => $route->circuit->id,
                        'name' => $route->circuit->name,
                        'zonal' => $route->circuit->zonal ? [
                            'id' => $route->circuit->zonal->id,
                            'name' => $route->circuit->zonal->name
                        ] : null
                    ] : null
                ],
                'stats' => [
                    'total' => $pdvs->count(),
                    'active' => $pdvs->where('status', 'vende')->count(),
                    'inactive' => $pdvs->where('status', '!=', 'vende')->count(),
                    'with_coordinates' => $pdvs->whereNotNull('latitude')->whereNotNull('longitude')->count()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los PDVs de la ruta',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
