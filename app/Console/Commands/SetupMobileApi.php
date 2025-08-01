<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SetupMobileApi extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'mobile:setup {--user=vendedor01} {--password=password123}';

    /**
     * The console command description.
     */
    protected $description = 'Configurar usuario de prueba para la API móvil';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $username = $this->option('user');
        $password = $this->option('password');

        $this->info('🚀 Configurando API móvil para MovilMacga...');

        // Verificar si el usuario ya existe
        $user = User::where('username', $username)->first();

        if (!$user) {
            $this->info("📱 Creando usuario de prueba: {$username}");
            
            $user = User::create([
                'name' => 'Vendedor Prueba',
                'dni' => '12345679',
                'first_name' => 'Vendedor',
                'last_name' => 'Prueba',
                'username' => $username,
                'phone_number' => '987654321',
                'status' => true,
                'email' => 'vendedor.prueba@movilmacga.com',
                'password' => Hash::make($password),
            ]);

            // Asignar rol de Vendedor
            if (!$user->hasRole('Vendedor')) {
                $user->assignRole('Vendedor');
                $this->info('✅ Rol de Vendedor asignado');
            }
        } else {
            $this->info("👤 Usuario {$username} ya existe");
            
            // Verificar que tenga rol de Vendedor
            if (!$user->hasRole('Vendedor')) {
                $user->assignRole('Vendedor');
                $this->info('✅ Rol de Vendedor asignado');
            }
        }

        // Mostrar información de configuración
        $this->newLine();
        $this->info('📋 CONFIGURACIÓN COMPLETADA');
        $this->table(
            ['Campo', 'Valor'],
            [
                ['Usuario', $user->username],
                ['Contraseña', $password],
                ['Rol', $user->getRoleNames()->implode(', ')],
                ['Estado', $user->status ? 'Activo' : 'Inactivo'],
                ['API Base URL', url('/api')],
            ]
        );

        $this->newLine();
        $this->info('🧪 EJEMPLO DE PRUEBA:');
        $this->line('curl -X POST "' . url('/api/auth/login') . '" \\');
        $this->line('  -H "Content-Type: application/json" \\');
        $this->line('  -d \'{"username":"' . $username . '","password":"' . $password . '","device_name":"Test Device"}\'');

        $this->newLine();
        $this->info('📖 Ver documentación completa en: API_DOCUMENTATION.md');
        
        return Command::SUCCESS;
    }
}