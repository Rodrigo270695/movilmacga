<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class FormSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()?->can('gestor-formularios-acceso');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'business_form_id' => 'required|exists:business_forms,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'order_index' => 'required|integer|min:0',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'business_form_id.required' => 'El formulario es obligatorio.',
            'business_form_id.exists' => 'El formulario seleccionado no existe.',
            'name.required' => 'El nombre de la sección es obligatorio.',
            'name.max' => 'El nombre de la sección no puede tener más de 255 caracteres.',
            'order_index.required' => 'El orden es obligatorio.',
            'order_index.integer' => 'El orden debe ser un número entero.',
            'order_index.min' => 'El orden debe ser mayor o igual a 0.',
        ];
    }
}
