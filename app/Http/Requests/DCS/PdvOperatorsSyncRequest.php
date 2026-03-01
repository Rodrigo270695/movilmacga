<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class PdvOperatorsSyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('gestor-pdv-operadores-editar');
    }

    public function rules(): array
    {
        return [
            'assignments' => ['required', 'array'],
            'assignments.*.pdv_id' => ['required', 'integer', 'exists:pdvs,id'],
            'assignments.*.operator_id' => ['required', 'integer', 'exists:operators,id'],
            'assignments.*.status' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'assignments.required' => 'Debe enviar al menos una asignación.',
            'assignments.*.pdv_id.exists' => 'Uno o más PDVs no son válidos.',
            'assignments.*.operator_id.exists' => 'Uno o más operadores no son válidos.',
        ];
    }
}
