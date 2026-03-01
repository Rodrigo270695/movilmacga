<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Http\Requests\DCS\OperatorRequest;
use App\Models\Operator;
use Inertia\Inertia;
use Illuminate\Http\Request;

class OperatorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (!auth()->user()?->can('gestor-operador-ver')) {
            abort(403, 'No tienes permisos para ver los operadores.');
        }

        $perPage = $request->get('per_page', 50);
        $page = $request->get('page', 1);
        $search = $request->get('search');

        $query = Operator::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $operators = $query->orderBy('name')->paginate($perPage);

        return Inertia::render('dcs/operators/index', [
            'operators' => $operators,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(OperatorRequest $request)
    {
        if (!auth()->user()->can('gestor-operador-crear')) {
            abort(403, 'No tienes permisos para crear operadores.');
        }

        $operator = Operator::create([
            'name' => $request->name,
            'description' => $request->description,
            'color' => $request->color,
            'status' => true,
        ]);

        return redirect()->route('dcs.operators.index')
            ->with('success', "Operador '{$operator->name}' creado exitosamente.");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(OperatorRequest $request, Operator $operator)
    {
        if (!auth()->user()->can('gestor-operador-editar')) {
            abort(403, 'No tienes permisos para editar operadores.');
        }

        $operator->update([
            'name' => $request->name,
            'description' => $request->description,
            'color' => $request->color,
        ]);

        return redirect()->route('dcs.operators.index')
            ->with('success', "Operador '{$operator->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Operator $operator)
    {
        if (!auth()->user()->can('gestor-operador-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de operadores.');
        }

        $operator->status = !$operator->status;
        $operator->save();

        $statusText = $operator->status ? 'activado' : 'desactivado';

        if (request()->header('X-Inertia')) {
            return back()->with('success', "Operador {$statusText} exitosamente.");
        }

        return redirect()->route('dcs.operators.index')
            ->with('success', "Operador {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Operator $operator)
    {
        if (!auth()->user()->can('gestor-operador-eliminar')) {
            abort(403, 'No tienes permisos para eliminar operadores.');
        }

        $operatorName = $operator->name;
        $operator->delete();

        return redirect()->route('dcs.operators.index')
            ->with('success', "Operador '{$operatorName}' eliminado exitosamente.");
    }
}
