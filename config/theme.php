<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tema activo de la aplicación
    |--------------------------------------------------------------------------
    |
    | Define qué tema/empresa se mostrará en esta instancia.
    | Cambia APP_THEME en el .env de cada servidor.
    |
    | Valores disponibles: "macga", "treinta"
    |
    */

    'active' => env('APP_THEME', 'macga'),

    'macga' => [
        'name'    => 'MacGa',
        'company' => 'MacGa Servicios',
        'logo'    => '/themes/macga/logo.png',
        'favicon' => '/themes/macga/logo.png',
        'class'   => 'theme-macga',
    ],

    'treinta' => [
        'name'    => 'Treinta',
        'company' => 'Treinta Servicios',
        'logo'    => '/themes/treinta/logo.png',
        'favicon' => '/themes/treinta/logo.png',
        'class'   => 'theme-treinta',
    ],

];
