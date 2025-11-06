<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class RouteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $routeId = $this->route('route')?->id ?? null;

        return [
            'circuit_id' => [
                'required',
                'integer',
                'exists:circuits,id',
            ],
            'name' => [
                'required',
                'string',
                'max:25',
                Rule::unique('routes', 'name')->ignore($routeId),
            ],
            'code' => [
                'required',
                'string',
                'max:25',
                Rule::unique('routes', 'code')->ignore($routeId),
            ],
            'telegestion' => [
                'boolean',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'circuit_id.required' => 'El circuito es obligatorio.',
            'circuit_id.integer' => 'El circuito debe ser un valor válido.',
            'circuit_id.exists' => 'El circuito seleccionado no existe.',

            'name.required' => 'El nombre de la ruta es obligatorio.',
            'name.string' => 'El nombre de la ruta debe ser un texto válido.',
            'name.max' => 'El nombre de la ruta no puede exceder los 25 caracteres.',
            'name.unique' => 'Ya existe una ruta con este nombre.',

            'code.required' => 'El código de la ruta es obligatorio.',
            'code.string' => 'El código de la ruta debe ser un texto válido.',
            'code.max' => 'El código de la ruta no puede exceder los 25 caracteres.',
            'code.unique' => 'Ya existe una ruta con este código.',
            'telegestion.boolean' => 'El campo telegestión debe ser verdadero o falso.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'circuit_id' => 'circuito',
            'name' => 'nombre de la ruta',
            'code' => 'código de la ruta',
            'telegestion' => 'telegestión',
        ];
    }
}
