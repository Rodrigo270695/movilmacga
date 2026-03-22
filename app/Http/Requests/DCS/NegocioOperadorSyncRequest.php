<?php

namespace App\Http\Requests\DCS;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NegocioOperadorSyncRequest extends FormRequest
{
    /**
     * Valores permitidos (enum en tabla pdv_business_types).
     *
     * @return array<int, string>
     */
    public static function businessTypeValues(): array
    {
        return [
            'Telco',
            'Bodega',
            'Agente',
            'Market',
            'Servicio Técnico',
            'Otros',
            'Exclusivo',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->can('gestor-negocio-operador-ver') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $types = self::businessTypeValues();

        return [
            'selections' => ['nullable', 'array'],
            'selections.*' => ['array'],
            'selections.*.*' => [Rule::in($types)],
            'operator_modes' => ['nullable', 'array'],
        ];
    }

    /**
     * Claves de selections = pdv_id (string numérico).
     *
     * @return array<string, array<int, string>>
     */
    public function selections(): array
    {
        $raw = $this->input('selections', []);
        $out = [];
        foreach ($raw as $pdvId => $types) {
            if (! is_array($types)) {
                continue;
            }
            $out[(string) $pdvId] = array_values(array_unique($types));
        }

        return $out;
    }

    /**
     * Claves: pdv_id → operator_id → { prepago, pospago }.
     *
     * @return array<string, array<string, array{prepago: bool, pospago: bool}>>
     */
    public function operatorModes(): array
    {
        $raw = $this->input('operator_modes', []);
        $out = [];
        foreach ($raw as $pdvId => $operators) {
            if (! is_array($operators)) {
                continue;
            }
            $inner = [];
            foreach ($operators as $opId => $flags) {
                if (! is_array($flags)) {
                    continue;
                }
                $inner[(string) $opId] = [
                    'prepago' => ! empty($flags['prepago']),
                    'pospago' => ! empty($flags['pospago']),
                ];
            }
            $out[(string) $pdvId] = $inner;
        }

        return $out;
    }
}
