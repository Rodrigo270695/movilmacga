<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuración de Tracking
    |--------------------------------------------------------------------------
    |
    | Define los parámetros por defecto para las validaciones de distancia
    | y otras reglas relacionadas con el seguimiento GPS en el backend.
    |
    */

    'default_check_in_radius_meters' => env('TRACKING_DEFAULT_CHECK_IN_RADIUS', 150),
];


