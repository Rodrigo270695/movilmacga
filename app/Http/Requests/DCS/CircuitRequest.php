<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class CircuitRequest extends FormRequest
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
        $circuitId = $this->route('circuit')?->id ?? null;

        return [
            'zonal_id' => [
                'required',
                'integer',
                'exists:zonales,id',
            ],
            'name' => [
                'required',
                'string',
                'max:25',
                Rule::unique('circuits', 'name')->ignore($circuitId),
            ],
            'code' => [
                'required',
                'string',
                'max:25',
                Rule::unique('circuits', 'code')->ignore($circuitId),
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
            'zonal_id.required' => 'El zonal es obligatorio.',
            'zonal_id.integer' => 'El zonal debe ser un valor válido.',
            'zonal_id.exists' => 'El zonal seleccionado no existe.',

            'name.required' => 'El nombre del circuito es obligatorio.',
            'name.string' => 'El nombre del circuito debe ser un texto válido.',
            'name.max' => 'El nombre del circuito no puede exceder los 25 caracteres.',
            'name.unique' => 'Ya existe un circuito con este nombre.',

            'code.required' => 'El código del circuito es obligatorio.',
            'code.string' => 'El código del circuito debe ser un texto válido.',
            'code.max' => 'El código del circuito no puede exceder los 25 caracteres.',
            'code.unique' => 'Ya existe un circuito con este código.',
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
            'zonal_id' => 'zonal',
            'name' => 'nombre del circuito',
            'code' => 'código del circuito',
        ];
    }
}
