<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cerrar jornadas laborales activas automáticamente a las 9 PM todos los días (hora de Perú)
Schedule::command('sessions:close-active')
    ->dailyAt('21:00')
    ->timezone('America/Lima')
    ->description('Cierra automáticamente todas las jornadas laborales activas a las 9 PM');
