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
                // Validar que el zonal no tenga ya 5 supervisores activos
                function ($attribute, $value, $fail) {
                    $currentCount = \App\Models\ZonalSupervisor::where('zonal_id', $value)
                        ->where('is_active', true)
                        ->when($this->route('zonalSupervisor'), function ($query) {
                            // Excluir el registro actual al actualizar
                            $query->where('id', '!=', $this->route('zonalSupervisor')->id);
                        })
                        ->count();

                    if ($currentCount >= 5) {
                        $fail('Este zonal ya tiene el máximo de 5 supervisores asignados.');
                    }
                },
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
                // Validar que este supervisor no esté ya asignado al zonal
                function ($attribute, $value, $fail) {
                    $exists = \App\Models\ZonalSupervisor::where('zonal_id', $this->zonal_id)
                        ->where('user_id', $value)
                        ->where('is_active', true)
                        ->when($this->route('zonalSupervisor'), function ($query) {
                            // Excluir el registro actual al actualizar
                            $query->where('id', '!=', $this->route('zonalSupervisor')->id);
                        })
                        ->exists();

                    if ($exists) {
                        $fail('Este supervisor ya está asignado a este zonal.');
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
            'user_id.required' => 'Debe seleccionar un supervisor.',
            'user_id.exists' => 'El supervisor seleccionado no existe.',
            'notes.max' => 'Las observaciones no pueden exceder los 1000 caracteres.',
        ];
    }
}
