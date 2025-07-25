<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class ZonalRequest extends FormRequest
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
        $zonalId = $this->route('zonal')?->id ?? null;

        return [
            'name' => [
                'required',
                'string',
                'max:30',
                Rule::unique('zonales', 'name')->ignore($zonalId),
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
            'name.required' => 'El nombre del zonal es obligatorio.',
            'name.string' => 'El nombre del zonal debe ser un texto válido.',
            'name.max' => 'El nombre del zonal no puede exceder los 30 caracteres.',
            'name.unique' => 'Ya existe un zonal con este nombre.',
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
            'name' => 'nombre del zonal',
        ];
    }
}
