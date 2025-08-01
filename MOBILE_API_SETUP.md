# 📱 **SETUP COMPLETO - API MÓVIL MOVILMACGA**

## 🎯 **¿Qué hemos creado?**

Sistema completo de APIs REST para la aplicación móvil de vendedores que incluye:

✅ **Autenticación segura** con Laravel Sanctum  
✅ **Gestión de jornadas laborales** (inicio/fin)  
✅ **Tracking GPS en tiempo real**  
✅ **Sistema de visitas a PDVs** con geofences  
✅ **Subida de fotos de evidencia**  
✅ **Dashboard en tiempo real** para supervisores  
✅ **Estadísticas y reportes** automáticos  

---

## 🚀 **INSTALACIÓN RÁPIDA**

### **1. Ejecutar Migraciones (si no se han ejecutado)**
```bash
php artisan migrate
```

### **2. Configurar Usuario de Prueba**
```bash
php artisan mobile:setup --user=vendedor01 --password=password123
```

### **3. Probar APIs**
```bash
node test-mobile-api.js http://localhost:8000
```

---

## 📋 **ESTRUCTURA CREADA**

### **🔧 Controladores API**
```
app/Http/Controllers/Api/
├── AuthController.php           # Login/logout vendedores
├── WorkingSessionController.php # Gestión jornadas
├── GpsTrackingController.php    # Tracking GPS
├── PdvVisitController.php       # Visitas a PDVs
└── UserDataController.php       # Datos vendedor
```

### **🛣️ Rutas API**
```
routes/api.php                   # Todas las rutas API móvil
```

### **🛡️ Middleware**
```
app/Http/Middleware/EnsureMobileUser.php  # Validación usuarios móviles
```

### **📋 Validaciones**
```
app/Http/Requests/Api/LocationRequest.php # Validación coordenadas GPS
```

### **🔧 Comandos**
```
app/Console/Commands/SetupMobileApi.php   # Comando setup automático
```

---

## 🎯 **ENDPOINTS PRINCIPALES**

### **🔐 Autenticación**
- `POST /api/auth/login` - Login vendedor
- `POST /api/auth/logout` - Logout vendedor  
- `GET /api/auth/profile` - Perfil y asignaciones

### **💼 Jornadas Laborales**
- `POST /api/working-sessions/start` - Iniciar jornada
- `POST /api/working-sessions/end` - Finalizar jornada
- `GET /api/working-sessions/current` - Jornada actual

### **📍 Tracking GPS**
- `POST /api/gps/location` - Enviar ubicación
- `POST /api/gps/batch-locations` - Enviar múltiples ubicaciones

### **🏪 Visitas PDV**
- `POST /api/pdv-visits/check-in` - Check-in PDV
- `POST /api/pdv-visits/check-out` - Check-out PDV
- `POST /api/pdv-visits/upload-photo` - Subir foto evidencia

### **📊 Datos Vendedor**
- `GET /api/user/pdvs-today` - PDVs del día
- `GET /api/user/stats` - Estadísticas vendedor

### **🖥️ Dashboard Supervisores**
- `GET /api/dashboard/real-time-locations` - Ubicaciones tiempo real
- `GET /api/dashboard/user/{user}/route` - Ruta específica vendedor

---

## 🧪 **PRUEBAS Y VALIDACIÓN**

### **1. Prueba Manual Rápida**
```bash
# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"vendedor01","password":"password123","device_name":"Test"}'

# Copiar el token de la respuesta y usar en siguientes requests
export TOKEN="1|abc123def..."

# Iniciar jornada
curl -X POST "http://localhost:8000/api/working-sessions/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":-12.046374,"longitude":-77.042793}'

# Enviar ubicación
curl -X POST "http://localhost:8000/api/gps/location" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":-12.046374,"longitude":-77.042793,"accuracy":5.0}'
```

### **2. Prueba Automatizada**
```bash
node test-mobile-api.js
```

---

## 🔒 **SEGURIDAD IMPLEMENTADA**

### **✅ Autenticación Robusta**
- Laravel Sanctum con tokens de 30 días
- Validación de roles (solo Vendedor/Supervisor)
- Revocación automática de tokens

### **✅ Validación de Datos**
- Coordenadas GPS válidas (-90/90, -180/180)
- Límites de velocidad y precisión
- Detección de ubicaciones falsas

### **✅ Middleware Personalizado**
- Verificación de usuario activo
- Validación de permisos específicos
- Control de acceso por roles

### **✅ Protección Anti-Fraude**
- Detección GPS simulado (`is_mock_location`)
- Validación de geofences automática
- Límites de tiempo para ubicaciones

---

## 📱 **INTEGRACIÓN CON APP MÓVIL**

### **Flujo Típico de la App:**

```javascript
// 1. Login al abrir app
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'vendedor01',
    password: 'password123',
    device_name: 'iPhone 13 - Juan'
  })
});

// 2. Iniciar jornada
const startSession = await fetch('/api/working-sessions/start', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  })
});

// 3. Enviar ubicación cada minuto
setInterval(async () => {
  await fetch('/api/gps/location', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      battery_level: navigator.getBattery().level * 100
    })
  });
}, 60000);

// 4. Check-in en PDV
const checkin = await fetch('/api/pdv-visits/check-in', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    pdv_id: selectedPdv.id,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  })
});
```

---

## 🔧 **CONFIGURACIÓN ADICIONAL**

### **Variables de Entorno (.env)**
```env
# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000

# Configuración de archivos
FILESYSTEM_DISK=public
```

### **Storage Link (para fotos)**
```bash
php artisan storage:link
```

### **Permisos de Directorio**
```bash
chmod -R 775 storage/app/public
```

---

## 🎯 **PRÓXIMOS PASOS**

### **1. Desarrollar App Móvil**
- React Native / Flutter
- Consumir estas APIs
- Implementar tracking GPS automático
- Sistema de fotos y formularios

### **2. Optimizaciones**
- Implementar cache Redis para ubicaciones
- Notificaciones push
- Sincronización offline

### **3. Monitoreo**
- Logs de API calls
- Métricas de performance
- Alertas automáticas

---

## 🆘 **TROUBLESHOOTING**

### **Error: "Sanctum not found"**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### **Error: "Token mismatch"**
```bash
php artisan config:clear
php artisan cache:clear
```

### **Error: "Storage not linked"**
```bash
php artisan storage:link
```

---

## 📖 **DOCUMENTACIÓN COMPLETA**

- **API_DOCUMENTATION.md** - Documentación completa de endpoints
- **test-mobile-api.js** - Script de pruebas automatizadas
- **MOBILE_API_SETUP.md** - Esta guía de instalación

---

## 🎉 **¡SISTEMA LISTO!**

**¡Tu sistema de APIs móviles está completamente configurado y listo para usar!** 

✅ **APIs funcionando**  
✅ **Seguridad implementada**  
✅ **Documentación completa**  
✅ **Scripts de prueba**  
✅ **Usuario de prueba configurado**  

**Próximo paso:** Desarrollar la aplicación móvil que consuma estas APIs.

🚀 **¡A construir la app móvil!**