<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckUserPermissions extends Command
{
    protected $signature = 'check:permissions {email}';
    protected $description = 'Verificar permisos de un usuario';

    public function handle()
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("❌ Usuario no encontrado: {$email}");
            return;
        }

        $this->info("👤 Usuario: {$user->email}");
        $this->info("📋 Roles:");

        foreach ($user->roles as $role) {
            $this->line("  - {$role->name}");
        }

        $this->info("🔑 Permisos:");

        $permissions = [
            'mapa-rastreo-vendedores-tiempo-real',
            'mapas-tracking-index',
            'mapas-index'
        ];

        foreach ($permissions as $permission) {
            $has = $user->can($permission);
            $status = $has ? '✅' : '❌';
            $this->line("  {$status} {$permission}");
        }

        // Verificar si tiene rol de administrador
        $this->info("👑 Es administrador: " . ($user->hasRole('Administrador') ? '✅' : '❌'));
        $this->info("👔 Es supervisor: " . ($user->hasRole('Supervisor Zonal') ? '✅' : '❌'));
    }
}
