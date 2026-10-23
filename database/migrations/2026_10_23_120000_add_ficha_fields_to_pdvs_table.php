<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE pdvs MODIFY classification VARCHAR(50) NOT NULL');
        }

        Schema::table('pdvs', function (Blueprint $table) {
            $table->string('estado_comercial', 20)->nullable()->after('status');
            $table->string('motivo_no_activo', 50)->nullable()->after('estado_comercial');
            $table->string('clasificacion_pdv', 30)->nullable()->after('motivo_no_activo');
            $table->string('tipo_pdv', 30)->nullable()->after('clasificacion_pdv');
            $table->string('detalle_pdv', 30)->nullable()->after('tipo_pdv');
            $table->string('tipo_portal', 30)->nullable()->after('detalle_pdv');
            $table->string('comercializacion', 50)->nullable()->after('tipo_portal');
            $table->string('contacto_referencial', 20)->nullable()->after('phone');
            $table->boolean('firmo_contrato')->default(false)->after('contacto_referencial');
            $table->string('tipo_contrato', 20)->nullable()->after('firmo_contrato');
            $table->boolean('tiene_huellero')->default(false)->after('tipo_contrato');
            $table->string('propiedad_huellero', 30)->nullable()->after('tiene_huellero');
            $table->boolean('visita_presencial')->default(true)->after('route_id');
            $table->string('frecuencia_visita', 20)->nullable()->after('visita_presencial');
            $table->string('tipo_zona', 20)->nullable()->after('longitude');
            $table->string('tipo_zona_urbana', 30)->nullable()->after('tipo_zona');
            $table->string('detalle_zona_urbana', 40)->nullable()->after('tipo_zona_urbana');
            $table->string('tipo_senal', 20)->nullable()->after('detalle_zona_urbana');
        });
    }

    public function down(): void
    {
        Schema::table('pdvs', function (Blueprint $table) {
            $table->dropColumn([
                'estado_comercial',
                'motivo_no_activo',
                'clasificacion_pdv',
                'tipo_pdv',
                'detalle_pdv',
                'tipo_portal',
                'comercializacion',
                'contacto_referencial',
                'firmo_contrato',
                'tipo_contrato',
                'tiene_huellero',
                'propiedad_huellero',
                'visita_presencial',
                'frecuencia_visita',
                'tipo_zona',
                'tipo_zona_urbana',
                'detalle_zona_urbana',
                'tipo_senal',
            ]);
        });
    }
};
