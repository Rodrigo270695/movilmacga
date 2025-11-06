<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class PdvRequest extends FormRequest
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
        $pdvId = $this->route('pdv')?->id;

        $rules = [
            'point_name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('pdvs', 'point_name')->ignore($pdvId)
            ],
            'pos_id' => [
                'nullable',
                'string',
                'max:6',
                Rule::unique('pdvs', 'pos_id')->ignore($pdvId)
            ],
            'document_type' => ['required', Rule::in(['DNI', 'RUC'])],
            'document_number' => [
                'required',
                'string',
                'max:12',
                function ($attribute, $value, $fail) {
                    $documentType = $this->input('document_type');
                    if ($documentType === 'DNI' && strlen($value) !== 8) {
                        $fail('El DNI debe tener exactamente 8 dígitos.');
                    } elseif ($documentType === 'RUC' && strlen($value) !== 11) {
                        $fail('El RUC debe tener exactamente 11 dígitos.');
                    }
                    if (!preg_match('/^[0-9]+$/', $value)) {
                        $fail('El número de documento solo puede contener números.');
                    }
                }
            ],
            'client_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:15'],
            'sells_recharge' => ['boolean'],
            'classification' => [
                'required',
                Rule::in(['telecomunicaciones', 'chalequeros', 'bodega', 'otras tiendas', 'desconocida', 'pusher', 'minimarket', 'botica', 'farmacia', 'tambo', 'cencosud'])
            ],
            'status' => [
                'required',
                Rule::in(['vende', 'no vende', 'no existe', 'pdv autoactivado', 'pdv impulsador'])
            ],
            'address' => ['required', 'string'],
            'reference' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'route_id' => ['required', 'exists:routes,id'],
            'district_id' => ['required', 'exists:distritos,id'],
            'locality' => ['required', 'string', 'max:255'],
        ];

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'point_name.required' => 'El nombre del punto es requerido.',
            'point_name.max' => 'El nombre del punto no debe exceder 50 caracteres.',
            'point_name.unique' => 'Este nombre de punto ya está en uso.',
            'document_type.required' => 'El tipo de documento es requerido.',
            'document_type.in' => 'El tipo de documento debe ser DNI o RUC.',
            'document_number.required' => 'El número de documento es requerido.',

            'client_name.required' => 'El nombre del cliente es requerido.',
            'client_name.max' => 'El nombre del cliente no debe exceder 255 caracteres.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'phone.max' => 'El número de teléfono no debe exceder 15 caracteres.',
            'classification.required' => 'La clasificación es requerida.',
            'classification.in' => 'La clasificación seleccionada no es válida.',
            'status.required' => 'El estado es requerido.',
            'status.in' => 'El estado seleccionado no es válido.',
            'address.required' => 'La dirección es requerida.',
            'latitude.numeric' => 'La latitud debe ser un número válido.',
            'latitude.between' => 'La latitud debe estar entre -90 y 90.',
            'longitude.numeric' => 'La longitud debe ser un número válido.',
            'longitude.between' => 'La longitud debe estar entre -180 y 180.',
            'route_id.required' => 'La ruta es requerida.',
            'route_id.exists' => 'La ruta seleccionada no existe.',
            'district_id.required' => 'El distrito es requerido.',
            'district_id.exists' => 'El distrito seleccionado no existe.',
            'locality.required' => 'La localidad es requerida.',
            'locality.max' => 'La localidad no debe exceder 255 caracteres.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'point_name' => 'nombre del punto',
            'pos_id' => 'ID POS',
            'document_type' => 'tipo de documento',
            'document_number' => 'número de documento',
            'client_name' => 'nombre del cliente',
            'email' => 'correo electrónico',
            'phone' => 'teléfono',
            'sells_recharge' => 'vende recarga',
            'classification' => 'clasificación',
            'status' => 'estado',
            'address' => 'dirección',
            'reference' => 'referencia',
            'latitude' => 'latitud',
            'longitude' => 'longitud',
            'route_id' => 'ruta',
            'district_id' => 'distrito',
            'locality' => 'localidad',
        ];
    }
}
