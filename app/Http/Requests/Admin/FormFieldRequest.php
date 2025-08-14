<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class FormFieldRequest extends FormRequest
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
        $rules = [
            'form_section_id' => 'required|exists:form_sections,id',
            'field_type' => 'required|string|in:' . implode(',', array_keys(\App\Models\FormField::FIELD_TYPES)),
            'label' => 'required|string|max:255',
            'placeholder' => 'nullable|string|max:255',
            'is_required' => 'boolean',
            'validation_rules' => 'nullable|array',
            'options' => 'nullable|array',
            'order_index' => 'required|integer|min:0',
            'min_value' => 'nullable|numeric',
            'max_value' => 'nullable|numeric',
            'file_types' => 'nullable|string|max:100',
            'max_file_size' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ];

        // Validaciones específicas por tipo de campo
        if ($this->field_type) {
            switch ($this->field_type) {
                case 'select':
                case 'radio':
                case 'checkbox':
                case 'multiselect':
                    $rules['options'] = 'required|array|min:1';
                    break;

                case 'number':
                    if ($this->min_value !== null && $this->max_value !== null) {
                        $rules['max_value'] .= '|gt:min_value';
                    }
                    break;

                case 'image':
                case 'pdf':
                case 'video':
                case 'audio':
                    $rules['file_types'] = 'required|string';
                    $rules['max_file_size'] = 'required|integer|min:1';
                    break;
            }
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'form_section_id.required' => 'La sección es obligatoria.',
            'form_section_id.exists' => 'La sección seleccionada no existe.',
            'field_type.required' => 'El tipo de campo es obligatorio.',
            'field_type.in' => 'El tipo de campo seleccionado no es válido.',
            'label.required' => 'La etiqueta del campo es obligatoria.',
            'label.max' => 'La etiqueta no puede tener más de 255 caracteres.',
            'order_index.required' => 'El orden es obligatorio.',
            'order_index.integer' => 'El orden debe ser un número entero.',
            'order_index.min' => 'El orden debe ser mayor o igual a 0.',
            'options.required' => 'Las opciones son obligatorias para este tipo de campo.',
            'options.min' => 'Debe tener al menos una opción.',
            'file_types.required' => 'Los tipos de archivo son obligatorios para este tipo de campo.',
            'max_file_size.required' => 'El tamaño máximo de archivo es obligatorio para este tipo de campo.',
            'max_file_size.min' => 'El tamaño máximo debe ser mayor a 0.',
            'max_value.gt' => 'El valor máximo debe ser mayor al valor mínimo.',
        ];
    }
}
