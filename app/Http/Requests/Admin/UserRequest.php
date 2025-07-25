<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserRequest extends FormRequest
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
        $userId = $this->route('user')?->id;

        $rules = [
            'first_name' => ['required', 'string', 'max:25'],
            'last_name' => ['required', 'string', 'max:25'],
            'username' => [
                'required',
                'string',
                'max:25',
                'regex:/^[a-zA-Z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($userId)
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId)
            ],
            'dni' => [
                'required',
                'string',
                'size:8',
                'regex:/^[0-9]+$/',
                Rule::unique('users', 'dni')->ignore($userId)
            ],
            'phone_number' => ['nullable', 'string', 'max:15'],
        ];

        // Agregar validación de contraseña solo para creación o si se proporciona
        if ($this->isMethod('post')) {
            // Para creación, la contraseña es opcional (se genera automática)
            $rules['password'] = ['nullable', 'string', 'min:6', 'confirmed'];
        } elseif ($this->filled('password')) {
            // Para actualización, solo validar si se proporciona
            $rules['password'] = ['string', 'min:6', 'confirmed'];
        }

        // Validación de roles si se proporciona
        if ($this->has('roles')) {
            $rules['roles'] = ['array'];
            $rules['roles.*'] = ['string', 'exists:roles,name'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'El nombre es requerido.',
            'first_name.max' => 'El nombre no debe exceder 25 caracteres.',
            'last_name.required' => 'El apellido es requerido.',
            'last_name.max' => 'El apellido no debe exceder 25 caracteres.',
            'username.required' => 'El nombre de usuario es requerido.',
            'username.max' => 'El nombre de usuario no debe exceder 25 caracteres.',
            'username.unique' => 'Este nombre de usuario ya está en uso.',
            'username.regex' => 'El nombre de usuario solo puede contener letras, números y guiones bajos.',
            'email.required' => 'El correo electrónico es requerido.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'email.unique' => 'Este correo electrónico ya está en uso.',
            'dni.required' => 'El DNI es requerido.',
            'dni.size' => 'El DNI debe tener exactamente 8 dígitos.',
            'dni.regex' => 'El DNI solo puede contener números.',
            'dni.unique' => 'Este DNI ya está registrado.',
            'phone_number.max' => 'El número de teléfono no debe exceder 15 caracteres.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'roles.array' => 'Los roles deben ser un array válido.',
            'roles.*.exists' => 'Uno o más roles seleccionados no existen.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'nombre',
            'last_name' => 'apellido',
            'username' => 'nombre de usuario',
            'email' => 'correo electrónico',
            'dni' => 'DNI',
            'phone_number' => 'número de teléfono',
            'password' => 'contraseña',
            'roles' => 'roles',
        ];
    }
}
