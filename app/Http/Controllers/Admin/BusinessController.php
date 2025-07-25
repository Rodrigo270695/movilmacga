<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BusinessRequest;
use App\Models\Business;
use App\Models\Zonal;
use Inertia\Inertia;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    // Los middleware de permisos están configurados en routes/admin.php

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!auth()->user()->can('gestor-business-ver')) {
            abort(403, 'No tienes permisos para ver los negocios.');
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $businesses = Business::withZonalesCount()
            ->orderBy('name')
            ->paginate($perPage);

        // Obtener zonales sin asignar para el selector
        $availableZonales = Zonal::unassigned()
            ->active()
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/businesses/index', [
            'businesses' => $businesses,
            'availableZonales' => $availableZonales,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BusinessRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-business-crear')) {
            abort(403, 'No tienes permisos para crear negocios.');
        }

        $business = Business::create([
            'name' => $request->name,
            'status' => true,
        ]);

        // Asignar zonales si se proporcionan
        if ($request->has('zonal_ids') && !empty($request->zonal_ids)) {
            Zonal::whereIn('id', $request->zonal_ids)
                  ->update(['business_id' => $business->id]);
        }

        return redirect()->route('admin.businesses.index')
            ->with('success', "Negocio '{$business->name}' creado exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BusinessRequest $request, Business $business)
    {
        // Verificar permisos de editar
        if (!auth()->user()->can('gestor-business-editar')) {
            abort(403, 'No tienes permisos para editar negocios.');
        }

        // Actualizar datos del negocio
        $business->update([
            'name' => $request->name,
        ]);

        // Sincronizar zonales
        if ($request->has('zonal_ids')) {
            // Desasignar zonales anteriores de este negocio
            Zonal::where('business_id', $business->id)
                  ->update(['business_id' => null]);

            // Asignar nuevos zonales si se proporcionan
            if (!empty($request->zonal_ids)) {
                Zonal::whereIn('id', $request->zonal_ids)
                      ->update(['business_id' => $business->id]);
            }
        }

        return redirect()->route('admin.businesses.index')
            ->with('success', "Negocio '{$business->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Business $business)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-business-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de negocios.');
        }

        // Determinar nuevo status
        $newStatus = $business->status ? 0 : 1;

        // Hacer el update
        $business->status = $newStatus;
        $business->save();

        $statusText = $newStatus ? 'activado' : 'desactivado';

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Negocio {$statusText} exitosamente.");
        }

        return redirect()->route('admin.businesses.index')
            ->with('success', "Negocio {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Business $business)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-business-eliminar')) {
            abort(403, 'No tienes permisos para eliminar negocios.');
        }

        // Desasignar zonales antes de eliminar
        Zonal::where('business_id', $business->id)
              ->update(['business_id' => null]);

        $businessName = $business->name;
        $business->delete();

        return redirect()->route('admin.businesses.index')
            ->with('success', "Negocio '{$businessName}' eliminado exitosamente.");
    }

            /**
     * Get business details with zonales for editing (AJAX only)
     */
    public function show(Business $business)
    {
        // Verificar permisos
        if (!auth()->user()->can('gestor-business-ver')) {
            abort(403, 'No tienes permisos para ver los negocios.');
        }

        $business->load('zonales');

        return response()->json([
            'business' => $business,
            'assignedZonales' => $business->zonales->pluck('id'),
        ]);
    }
}
