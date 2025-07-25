<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class BusinessRequest extends FormRequest
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
        $businessId = $this->route('business')?->id;

        $rules = [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('businesses', 'name')->ignore($businessId)
            ],
        ];

        // Validación de zonales si se proporciona
        if ($this->has('zonal_ids')) {
            $rules['zonal_ids'] = ['array'];
            $rules['zonal_ids.*'] = ['integer', 'exists:zonales,id'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del negocio es requerido.',
            'name.max' => 'El nombre del negocio no debe exceder 50 caracteres.',
            'name.unique' => 'Ya existe un negocio con este nombre.',
            'zonal_ids.array' => 'Los zonales deben ser un array válido.',
            'zonal_ids.*.integer' => 'Cada zonal debe ser un ID válido.',
            'zonal_ids.*.exists' => 'Uno o más zonales seleccionados no existen.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre del negocio',
            'zonal_ids' => 'zonales',
        ];
    }
}
