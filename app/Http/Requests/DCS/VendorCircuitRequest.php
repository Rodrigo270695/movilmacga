<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VendorCircuitRequest extends FormRequest
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
            'circuit_id' => [
                'required',
                'integer',
                'exists:circuits,id',
                // Validar que la combinación usuario-circuito no exista ya activa
                function ($attribute, $value, $fail) {
                    $userId = $this->input('user_id');
                    $existingAssignment = \App\Models\UserCircuit::where('circuit_id', $value)
                        ->where('user_id', $userId)
                        ->where('is_active', true)
                        ->when($this->route('userCircuit'), function ($query) {
                            $query->where('id', '!=', $this->route('userCircuit')->id);
                        })
                        ->exists();

                    if ($existingAssignment) {
                        $fail('Este vendedor ya está asignado a este circuito.');
                    }
                },
            ],
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                // Validar que el usuario tenga rol de Vendedor
                function ($attribute, $value, $fail) {
                    $user = \App\Models\User::find($value);
                    if ($user && !$user->hasRole('Vendedor')) {
                        $fail('El usuario seleccionado debe tener el rol de Vendedor.');
                    }
                },
            ],
            'priority' => 'nullable|integer|min:1|max:5',
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
            'circuit_id' => 'circuito',
            'user_id' => 'vendedor',
            'priority' => 'prioridad',
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
            'circuit_id.required' => 'Debe seleccionar un circuito.',
            'circuit_id.exists' => 'El circuito seleccionado no existe.',
            'circuit_id.unique' => 'Este vendedor ya está asignado a este circuito.',
            'user_id.required' => 'Debe seleccionar un vendedor.',
            'user_id.exists' => 'El vendedor seleccionado no existe.',
            'priority.min' => 'La prioridad debe ser al menos 1.',
            'priority.max' => 'La prioridad no puede ser mayor a 5.',
            'notes.max' => 'Las observaciones no pueden exceder los 1000 caracteres.',
        ];
    }
}
