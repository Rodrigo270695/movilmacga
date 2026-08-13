<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisitSettingsController extends Controller
{
    /**
     * Muestra la configuración de visitas (distancia máxima, tiempo mínimo
     * para finalizar y máximo de visitas por PDV al día) de cada negocio/marca.
     */
    public function index()
    {
        if (!auth()->user()->can('gestor-business-ver')) {
            abort(403, 'No tienes permisos para ver la configuración de visitas.');
        }

        $businesses = Business::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'status',
                'max_visit_distance_meters',
                'min_visit_duration_minutes',
                'max_visits_per_pdv_per_day',
            ]);

        return Inertia::render('admin/visit-settings/index', [
            'businesses' => $businesses,
        ]);
    }

    /**
     * Actualiza la configuración de visitas de un negocio específico.
     */
    public function update(Request $request, Business $business)
    {
        if (!auth()->user()->can('gestor-business-editar')) {
            abort(403, 'No tienes permisos para editar la configuración de visitas.');
        }

        $validated = $request->validate([
            'max_visit_distance_meters' => 'required|integer|min:1|max:5000',
            'min_visit_duration_minutes' => 'required|integer|min:0|max:180',
            'max_visits_per_pdv_per_day' => 'required|integer|min:1|max:10',
        ]);

        $business->update($validated);

        return back()->with('success', "Configuración de visitas de '{$business->name}' actualizada exitosamente.");
    }
}
