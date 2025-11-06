<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\ZonalRequest;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ZonalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!auth()->user()?->can('gestor-zonal-ver')) {
            abort(403, 'No tienes permisos para ver los zonales.');
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        $search = $request->get('search');
        $businessFilter = $request->get('business_filter');

        $query = Zonal::with('business')->withCount('circuits');

        // Filtrar por búsqueda
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('business', function ($businessQuery) use ($search) {
                      $businessQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filtrar por empresa
        if ($businessFilter && $businessFilter !== 'all') {
            if ($businessFilter === 'sin asignar') {
                $query->whereNull('business_id');
            } else {
                $query->whereHas('business', function ($businessQuery) use ($businessFilter) {
                    $businessQuery->where('name', $businessFilter);
                });
            }
        }

        $zonales = $query->orderBy('name')->paginate($perPage);

        // OPTIMIZACIÓN: Usar caché para empresas (TTL: 10 minutos)
        $businesses = \Illuminate\Support\Facades\Cache::remember('active_businesses', 600, function () {
            return \App\Models\Business::where('status', true)
                ->orderBy('name')
                ->get(['id', 'name']);
        });

        return Inertia::render('dcs/zonales/index', [
            'zonales' => $zonales,
            'businesses' => $businesses,
            'filters' => [
                'search' => $search,
                'business_filter' => $businessFilter,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ZonalRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-zonal-crear')) {
            abort(403, 'No tienes permisos para crear zonales.');
        }

        $zonal = Zonal::create([
            'name' => $request->name,
            'status' => true,
        ]);

        return redirect()->route('dcs.zonales.index')
            ->with('success', "Zonal '{$zonal->name}' creado exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ZonalRequest $request, Zonal $zonal)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-zonal-editar')) {
            abort(403, 'No tienes permisos para editar zonales.');
        }

        $zonal->update([
            'name' => $request->name,
        ]);

        return redirect()->route('dcs.zonales.index')
            ->with('success', "Zonal '{$zonal->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Zonal $zonal)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-zonal-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de zonales.');
        }

        // Determinar nuevo status de forma simple
        $newStatus = $zonal->status ? 0 : 1; // Si es 1 lo ponemos en 0, si es 0 lo ponemos en 1

        // Hacer el update
        $zonal->status = $newStatus;
        $zonal->save();

        $statusText = $newStatus ? 'activado' : 'desactivado';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Zonal {$statusText} exitosamente.");
        }

        return redirect()->route('dcs.zonales.index')
            ->with('success', "Zonal {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Zonal $zonal)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-zonal-eliminar')) {
            abort(403, 'No tienes permisos para eliminar zonales.');
        }

        $zonalName = $zonal->name;
        $zonal->delete();

        return redirect()->route('dcs.zonales.index')
            ->with('success', "Zonal '{$zonalName}' eliminado exitosamente.");
    }
}
