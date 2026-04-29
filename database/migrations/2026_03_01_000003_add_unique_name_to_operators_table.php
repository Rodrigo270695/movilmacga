<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade unique(name) solo si no existe (compatible con MySQL y PostgreSQL).
     */
    public function up(): void
    {
        if (!$this->indexExists('operators', 'operators_name_unique')) {
            Schema::table('operators', function (Blueprint $table) {
                $table->unique('name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->indexExists('operators', 'operators_name_unique')) {
            Schema::table('operators', function (Blueprint $table) {
                $table->dropUnique(['name']);
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();

        if ($connection->getDriverName() === 'pgsql') {
            $result = $connection->select(
                "SELECT COUNT(*) as count FROM pg_indexes WHERE tablename = ? AND indexname = ?",
                [$table, $indexName]
            );
        } else {
            $result = $connection->select(
                "SHOW INDEX FROM {$table} WHERE Key_name = ?",
                [$indexName]
            );
            return collect($result)->isNotEmpty();
        }

        return $result[0]->count > 0;
    }
};
