# 🚀 Sistema de Tracking GPS - MovilMacGA

Sistema completo de tracking GPS para vendedores móviles con dashboard en tiempo real, gestión de PDVs y sistema de permisos avanzado.

## 📋 Características Principales

- 📱 **API Móvil** - Para aplicación de vendedores con tracking GPS
- 🗺️ **Dashboard en Tiempo Real** - Tracking de vendedores con mapas interactivos
- 🏪 **Gestión de PDVs** - Puntos de venta con geolocalización
- 👥 **Sistema de Roles y Permisos** - Control granular de acceso
- 🛤️ **Gestión de Circuitos y Rutas** - Organización territorial
- 📊 **Estadísticas Avanzadas** - Métricas de cumplimiento y rendimiento

## 🛠️ Tecnologías

### Backend
- **Laravel 12** - Framework PHP
- **PHP 8.2+** - Lenguaje de programación
- **MySQL** - Base de datos
- **Laravel Sanctum** - Autenticación API
- **Spatie Laravel Permission** - Sistema de permisos

### Frontend
- **React 19** - Framework JavaScript
- **TypeScript** - Tipado estático
- **Inertia.js** - SPA sin API REST
- **Tailwind CSS 4** - Framework CSS
- **Radix UI** - Componentes accesibles
- **Leaflet** - Mapas interactivos

## 📦 Instalación

### Prerrequisitos
- PHP 8.2 o superior
- Composer
- Node.js 18+ y npm
- MySQL 8.0+
- Git

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd movilmacga
```

### 2. Instalar dependencias PHP
```bash
composer install
```

### 3. Instalar dependencias JavaScript
```bash
npm install
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
php artisan key:generate
```

Editar `.env` con tu configuración de base de datos:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=movilmacga
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
```

### 5. Ejecutar migraciones y seeders
```bash
php artisan migrate --seed
```

### 6. Compilar assets
```bash
npm run build
```

### 7. Iniciar servidor de desarrollo
```bash
# Terminal 1: Servidor PHP
php artisan serve

# Terminal 2: Vite (desarrollo)
npm run dev

# Terminal 3: Cola de trabajos (opcional)
php artisan queue:work
```

## 🔐 Acceso Inicial

### Usuario Administrador
- **Usuario:** admin
- **Contraseña:** password123
- **DNI:** 12345678

### URL de Acceso
- **Dashboard:** http://localhost:8000
- **API Base:** http://localhost:8000/api

## 📱 API Móvil

### Autenticación
```bash
POST /api/auth/login
{
    "username": "vendedor1",
    "password": "password123"
}
```

### Endpoints Principales

#### Tracking GPS
```bash
POST /api/gps/location
POST /api/gps/batch-locations
GET /api/gps/my-route-today
```

#### Jornadas Laborales
```bash
POST /api/working-sessions/start
POST /api/working-sessions/end
POST /api/working-sessions/pause
POST /api/working-sessions/resume
```

#### Visitas PDV
```bash
POST /api/pdv-visits/check-in
POST /api/pdv-visits/check-out
POST /api/pdv-visits/upload-photo
```

## 🗺️ Dashboard de Tracking

### Funcionalidades
- **Tracking en tiempo real** de vendedores
- **Mapas interactivos** con múltiples proveedores
- **Filtros avanzados** por negocio, zonal, circuito
- **Visualización de PDVs** con estados y clasificaciones
- **Estadísticas de cumplimiento** por vendedor

### Permisos Requeridos
- `mapa-rastreo-vendedores-ver` - Ver mapa de tracking
- `mapa-rastreo-vendedores-ver` - Ver PDVs en mapa

## 👥 Gestión de Usuarios y Roles

### Roles Disponibles
- **👑 Administrador** - Acceso completo
- **👨‍💼 Supervisor** - Acceso limitado por zonal
- **👤 Vendedor** - Solo acceso móvil

### Permisos Principales
- Gestión de usuarios, roles, circuitos, rutas
- Acceso a mapas y estadísticas
- Configuración del sistema

## 🏪 Gestión de PDVs

### Estados de PDV
- 🟢 **Vende** - Activo y vendiendo
- 🟡 **No vende** - Inactivo temporalmente
- 🔴 **No existe** - PDV cerrado
- 🟣 **PDV autoactivado** - Activación automática
- 🔵 **PDV impulsador** - PDV promocional

### Clasificaciones
- 📱 Telecomunicaciones
- 👥 Chalequeros
- 🏪 Bodega
- 🏬 Otras tiendas
- 📢 Pusher

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Regenerar autoload
composer dump-autoload

# Ver rutas
php artisan route:list

# Tinker
php artisan tinker
```

### Base de Datos
```bash
# Resetear base de datos
php artisan migrate:fresh --seed

# Crear migración
php artisan make:migration create_nueva_tabla

# Ejecutar seeders específicos
php artisan db:seed --class=UserSeeder
```

### Testing
```bash
# Ejecutar tests
php artisan test

# Tests con coverage
php artisan test --coverage
```

## 📊 Estructura del Proyecto

```
movilmacga/
├── app/
│   ├── Http/Controllers/
│   │   ├── Api/           # Controladores API móvil
│   │   ├── Admin/         # Controladores administración
│   │   └── Mapas/         # Controladores mapas
│   ├── Models/            # Modelos Eloquent
│   └── Providers/         # Proveedores de servicios
├── database/
│   ├── migrations/        # Migraciones de BD
│   └── seeders/          # Datos de prueba
├── resources/js/
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas de la aplicación
│   └── types/            # Tipos TypeScript
└── routes/
    ├── api.php           # Rutas API móvil
    ├── web.php           # Rutas web
    └── admin.php         # Rutas administración
```

## 🚀 Despliegue

### Producción
```bash
# Optimizar para producción
composer install --optimize-autoloader --no-dev
npm run build

# Configurar caché
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Configurar supervisor para colas
# Ver documentación de Laravel para colas
```

### Variables de Entorno de Producción
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com

DB_CONNECTION=mysql
DB_HOST=tu-host
DB_DATABASE=tu-database
DB_USERNAME=tu-username
DB_PASSWORD=tu-password

QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@movilmacga.com
- 📱 Teléfono: +51 XXX XXX XXX
- 🌐 Web: https://movilmacga.com

---

**¡Gracias por usar MovilMacGA!** 🚀
