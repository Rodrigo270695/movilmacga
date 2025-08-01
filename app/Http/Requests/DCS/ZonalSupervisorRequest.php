<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ZonalSupervisorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'zonal_id' => [
                'required',
                'integer',
                'exists:zonales,id',
                // Validar que el zonal no tenga ya un supervisor activo (solo en creación)
                Rule::unique('zonal_supervisors', 'zonal_id')
                    ->where('is_active', true)
                    ->ignore($this->route('zonalSupervisor')?->id),
            ],
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                // Validar que el usuario tenga rol de Supervisor
                function ($attribute, $value, $fail) {
                    $user = \App\Models\User::find($value);
                    if ($user && !$user->hasRole('Supervisor')) {
                        $fail('El usuario seleccionado debe tener el rol de Supervisor.');
                    }
                },
            ],
            'notes' => 'nullable|string|max:1000',
            'assignment_data' => 'nullable|array',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'zonal_id' => 'zonal',
            'user_id' => 'supervisor',
            'notes' => 'observaciones',
            'assignment_data' => 'datos adicionales',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'zonal_id.required' => 'Debe seleccionar un zonal.',
            'zonal_id.exists' => 'El zonal seleccionado no existe.',
            'zonal_id.unique' => 'Este zonal ya tiene un supervisor asignado.',
            'user_id.required' => 'Debe seleccionar un supervisor.',
            'user_id.exists' => 'El supervisor seleccionado no existe.',
            'notes.max' => 'Las observaciones no pueden exceder los 1000 caracteres.',
        ];
    }
}
