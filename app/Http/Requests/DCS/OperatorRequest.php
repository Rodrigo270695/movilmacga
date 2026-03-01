<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class OperatorRequest extends FormRequest
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
        $operatorId = $this->route('operator')?->id ?? null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('operators', 'name')->ignore($operatorId),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
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
            'name.required' => 'El nombre del operador es obligatorio.',
            'name.string' => 'El nombre del operador debe ser un texto válido.',
            'name.max' => 'El nombre del operador no puede exceder los 255 caracteres.',
            'name.unique' => 'Ya existe un operador con este nombre.',
            'description.max' => 'La descripción no puede exceder los 500 caracteres.',
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
            'name' => 'nombre del operador',
            'description' => 'descripción',
            'color' => 'color',
        ];
    }
}
