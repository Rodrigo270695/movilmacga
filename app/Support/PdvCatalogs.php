<?php

namespace App\Support;

class PdvCatalogs
{
    public static function rubros(): array
    {
        return [
            'telecomunicaciones' => 'Telecomunicaciones',
            'servicio_tecnico' => 'Servicio Técnico',
            'botica' => 'Botica',
            'modulo_de_venta' => 'Módulo de Venta',
            'minimarket' => 'Mini Market',
            'bodega' => 'Bodega',
            'tambo' => 'Tambo',
            'otros' => 'Otros',
            'chalequeros' => 'Chalequeros',
            'otras tiendas' => 'Otras Tiendas',
            'desconocida' => 'Desconocida',
            'pusher' => 'Pusher',
            'farmacia' => 'Farmacia',
            'cencosud' => 'Cencosud',
        ];
    }

    public static function estadosComerciales(): array
    {
        return [
            'activo' => 'Activo',
            'no_activo' => 'No Activo',
        ];
    }

    public static function motivosNoActivo(): array
    {
        return [
            'no_tiene_local' => 'No tiene Local',
            'cambio_giro_negocio' => 'Cambió Giro de Negocio',
            'no_hay_compromiso' => 'No hay compromiso',
            'traspaso_negocio' => 'Traspasó su Negocio',
            'usuario_bloqueado' => 'Usuario Bloqueado',
            'localidad_sin_senal' => 'Localidad sin Señal',
        ];
    }

    public static function clasificacionesPdv(): array
    {
        return [
            'regular' => 'PdV Regular',
            'autoactivado' => 'PdV Autoactivado',
            'mixto' => 'PdV Mixto',
        ];
    }

    public static function tiposPdv(): array
    {
        return [
            'monopunto' => 'Monopunto',
        ];
    }

    public static function detallesPdv(): array
    {
        return [
            'principal' => 'Principal',
            'sucursal' => 'Sucursal',
        ];
    }

    public static function tiposPortal(): array
    {
        return [
            'ad_macga' => 'AD Macga',
            'red_digital' => 'Red Digital',
            'otro' => 'Otro',
        ];
    }

    public static function comercializaciones(): array
    {
        return [
            'solo_movistar' => 'Solo Movistar',
            'movistar_claro' => 'Movistar y Claro',
            'movistar_bitel' => 'Movistar y Bitel',
            'movistar_entel' => 'Movistar y Entel',
            'movistar_claro_entel' => 'Movistar, Claro y Entel',
            'movistar_claro_bitel' => 'Movistar, Claro y Bitel',
            'movistar_bitel_entel' => 'Movistar, Bitel y Entel',
            'todos_operadores' => 'Todos los Operadores',
        ];
    }

    public static function tiposContrato(): array
    {
        return [
            'con_ruc' => 'Con RUC',
            'con_dni' => 'Con DNI',
        ];
    }

    public static function propiedadesHuellero(): array
    {
        return [
            'propio' => 'Propio',
            'competencia' => 'Competencia',
            'ad_macga' => 'AD Macga',
        ];
    }

    public static function frecuenciasVisita(): array
    {
        return [
            'interdiario' => 'Interdiario',
            'semanal' => 'Semanal',
            'quincenal' => 'Quincenal',
            'mensual' => 'Mensual',
        ];
    }

    public static function tiposZona(): array
    {
        return [
            'urbano' => 'Urbano',
            'rural' => 'Rural',
        ];
    }

    public static function tiposZonaUrbana(): array
    {
        return [
            'conglomerado' => 'Conglomerado',
            'zona_caliente' => 'Zona Caliente',
            'zona_calmada' => 'Zona Calmada',
        ];
    }

    public static function detallesZonaUrbana(): array
    {
        return [
            'mercado' => 'Mercado',
            'plaza_de_armas' => 'Plaza de Armas',
            'galeria' => 'Galería',
            'mall' => 'Mall',
            'centro_comercial' => 'Centro Comercial',
            'plazuela' => 'Plazuela',
            'terminal_terrestre' => 'Terminal Terrestre',
            'aeropuerto' => 'Aereopuerto',
            'paradero' => 'Paradero',
            'mercadillo' => 'Mercadillo',
            'zona_telco' => 'Zona Telco',
            'otros' => 'Otros',
        ];
    }

    public static function tiposSenal(): array
    {
        return [
            'buena' => 'Buena',
            'regular' => 'Regular',
            'mala' => 'Mala',
        ];
    }

    public static function label(array $catalog, ?string $value): string
    {
        if (! $value) {
            return '';
        }

        return $catalog[$value] ?? $value;
    }
}
