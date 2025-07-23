<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Aquí puedes agregar lógica de autorización si es necesario
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($roleId),
            ],
            'permissions' => [
                'sometimes',
                'nullable',
                'array',
            ],
            'permissions.*' => [
                'exists:permissions,name',
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del rol es requerido.',
            'name.unique' => 'Este nombre de rol ya existe.',
            'name.max' => 'El nombre del rol no puede tener más de 255 caracteres.',
            'permissions.array' => 'Los permisos deben ser un arreglo.',
            'permissions.*.exists' => 'Uno o más permisos seleccionados no existen.',
        ];
    }
}
