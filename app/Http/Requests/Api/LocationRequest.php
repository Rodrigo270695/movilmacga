<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Contracts\Validation\Validator;

class LocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // La autorización se maneja en el middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'required', 
                'numeric',
                'between:-180,180',
            ],
            'accuracy' => [
                'nullable',
                'numeric',
                'min:0',
                'max:1000', // Máximo 1000 metros de precisión
            ],
            'speed' => [
                'nullable',
                'numeric',
                'min:0',
                'max:300', // Máximo 300 km/h (validación de cordura)
            ],
            'heading' => [
                'nullable',
                'numeric',
                'between:0,360',
            ],
            'battery_level' => [
                'nullable',
                'integer',
                'between:0,100',
            ],
            'is_mock_location' => [
                'nullable',
                'boolean',
            ],
            'recorded_at' => [
                'nullable',
                'date',
                'before_or_equal:now',
                'after:' . now()->subDays(7)->toDateString(), // No más de 7 días atrás
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'latitude.required' => 'La latitud es requerida.',
            'latitude.between' => 'La latitud debe estar entre -90 y 90 grados.',
            'longitude.required' => 'La longitud es requerida.',
            'longitude.between' => 'La longitud debe estar entre -180 y 180 grados.',
            'accuracy.max' => 'La precisión no puede ser mayor a 1000 metros.',
            'speed.max' => 'La velocidad no puede ser mayor a 300 km/h.',
            'heading.between' => 'La dirección debe estar entre 0 y 360 grados.',
            'battery_level.between' => 'El nivel de batería debe estar entre 0 y 100.',
            'recorded_at.before_or_equal' => 'La fecha de registro no puede ser futura.',
            'recorded_at.after' => 'La fecha de registro no puede ser mayor a 7 días atrás.',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Datos de ubicación inválidos.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}