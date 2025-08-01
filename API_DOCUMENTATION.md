# 📱 **API DOCUMENTATION - MovilMacga Mobile App**

## 🎯 **Resumen**

APIs REST para la aplicación móvil de vendedores del sistema MovilMacga.

**Base URL:** `https://tu-dominio.com/api`  
**Autenticación:** Laravel Sanctum (Bearer Token)  
**Formato:** JSON  

---

## 🔐 **AUTENTICACIÓN**

### **POST** `/auth/login`
Login de vendedor/supervisor para obtener token de acceso.

#### Request Body:
```json
{
  "username": "vendedor01",
  "password": "password123",
  "device_name": "iPhone 13 - Juan Pérez"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "first_name": "Juan",
      "last_name": "Pérez",
      "username": "vendedor01",
      "dni": "12345678",
      "phone_number": "987654321",
      "roles": ["Vendedor"]
    },
    "token": "1|abc123def456...",
    "expires_at": "2024-02-15T10:30:00.000000Z"
  }
}
```

### **POST** `/auth/logout` 🔒
Cerrar sesión y revocar token actual.

#### Headers:
```
Authorization: Bearer {token}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

### **GET** `/auth/profile` 🔒
Obtener perfil y asignaciones del usuario.

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "roles": ["Vendedor"]
    },
    "assignments": {
      "circuits": [
        {
          "assignment_id": 1,
          "circuit_id": 2,
          "circuit_name": "Norte A",
          "circuit_code": "NTA-001",
          "zonal_name": "Lima Norte",
          "priority": 1
        }
      ]
    }
  }
}
```

---

## 💼 **JORNADAS LABORALES**

### **POST** `/working-sessions/start` 🔒
Iniciar jornada laboral.

#### Request Body:
```json
{
  "latitude": -12.046374,
  "longitude": -77.042793,
  "notes": "Inicio desde oficina central"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Jornada iniciada exitosamente",
  "data": {
    "session_id": 123,
    "started_at": "2024-01-15T08:00:00Z",
    "status": "active"
  }
}
```

### **POST** `/working-sessions/end` 🔒
Finalizar jornada laboral.

#### Request Body:
```json
{
  "latitude": -12.046374,
  "longitude": -77.042793,
  "notes": "Fin de jornada - 8 PDVs visitados"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Jornada finalizada exitosamente",
  "data": {
    "session_id": 123,
    "started_at": "2024-01-15T08:00:00Z",
    "ended_at": "2024-01-15T17:30:00Z",
    "duration_minutes": 570,
    "pdvs_visited": 8,
    "distance_km": 45.5
  }
}
```

### **GET** `/working-sessions/current` 🔒
Obtener jornada actual (si existe).

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "session_id": 123,
    "started_at": "2024-01-15T08:00:00Z",
    "status": "active",
    "current_duration_minutes": 120,
    "pdvs_visited_today": 3
  }
}
```

---

## 📍 **TRACKING GPS**

### **POST** `/gps/location` 🔒
Registrar ubicación GPS individual.

#### Request Body:
```json
{
  "latitude": -12.046374,
  "longitude": -77.042793,
  "accuracy": 5.0,
  "speed": 25.5,
  "heading": 180.0,
  "battery_level": 85,
  "is_mock_location": false,
  "recorded_at": "2024-01-15T09:30:00Z"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Ubicación registrada",
  "data": {
    "location_id": 456,
    "recorded_at": "2024-01-15T09:30:00Z"
  }
}
```

### **POST** `/gps/batch-locations` 🔒
Registrar múltiples ubicaciones (útil cuando hay mala conectividad).

#### Request Body:
```json
{
  "locations": [
    {
      "latitude": -12.046374,
      "longitude": -77.042793,
      "accuracy": 5.0,
      "recorded_at": "2024-01-15T09:30:00Z"
    },
    {
      "latitude": -12.046380,
      "longitude": -77.042800,
      "accuracy": 4.0,
      "recorded_at": "2024-01-15T09:31:00Z"
    }
  ]
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Ubicaciones registradas en lote",
  "data": {
    "locations_count": 2,
    "processed_at": "2024-01-15T09:32:00Z"
  }
}
```

---

## 🏪 **VISITAS A PDVs**

### **POST** `/pdv-visits/check-in` 🔒
Hacer check-in en un PDV.

#### Request Body:
```json
{
  "pdv_id": 789,
  "latitude": -12.046374,
  "longitude": -77.042793,
  "notes": "Cliente presente, local abierto"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Check-in realizado exitosamente",
  "data": {
    "visit_id": 321,
    "pdv_name": "Bodega San Martin",
    "check_in_at": "2024-01-15T10:30:00Z",
    "distance_to_pdv_meters": 15.5,
    "is_within_geofence": true,
    "is_valid": true
  }
}
```

### **POST** `/pdv-visits/check-out` 🔒
Hacer check-out de un PDV.

#### Request Body:
```json
{
  "visit_id": 321,
  "notes": "Venta realizada exitosamente",
  "visit_data": {
    "products_sold": ["Recarga Movistar", "Recarga Claro"],
    "sale_amount": 50.00,
    "customer_satisfaction": "satisfied"
  }
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Check-out realizado exitosamente",
  "data": {
    "visit_id": 321,
    "check_out_at": "2024-01-15T11:00:00Z",
    "duration_minutes": 30,
    "status": "completed"
  }
}
```

### **POST** `/pdv-visits/upload-photo` 🔒
Subir foto de evidencia de la visita.

#### Request Body (multipart/form-data):
```
visit_id: 321
photo: [archivo imagen]
photo_type: "exterior"
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Foto subida exitosamente",
  "data": {
    "visit_id": 321,
    "photo_path": "pdv-visits/2024/01/15/visit_321_1705312800_abc123.jpg",
    "photo_url": "https://tu-dominio.com/storage/pdv-visits/2024/01/15/visit_321_1705312800_abc123.jpg"
  }
}
```

---

## 📊 **DATOS DEL USUARIO**

### **GET** `/user/pdvs-today` 🔒
Obtener PDVs que debe visitar hoy.

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "day_of_week": "Monday",
    "pdvs_count": 10,
    "visited_count": 3,
    "pending_count": 7,
    "pdvs": [
      {
        "id": 789,
        "point_name": "Bodega San Martin",
        "client_name": "María García",
        "address": "Av. Principal 123",
        "latitude": -12.046374,
        "longitude": -77.042793,
        "visited_today": false,
        "classification": "bodega"
      }
    ]
  }
}
```

### **GET** `/user/stats?period=today` 🔒
Obtener estadísticas del vendedor.

#### Query Parameters:
- `period`: today|week|month (default: today)

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "period": "today",
    "date_from": "2024-01-15",
    "date_to": "2024-01-15",
    "visits": {
      "total": 8,
      "valid": 7,
      "completed": 6,
      "scheduled": 10,
      "compliance_percentage": 70.0,
      "average_duration_minutes": 25.5
    },
    "working_sessions": {
      "total": 1,
      "completed": 0,
      "total_hours": 8.5,
      "total_distance_km": 45.5
    }
  }
}
```

---

## ⚠️ **CÓDIGOS DE ERROR**

### **400 - Bad Request**
```json
{
  "success": false,
  "message": "Ya tienes una jornada activa. Debes finalizarla primero.",
  "data": {
    "active_session_id": 123
  }
}
```

### **401 - Unauthorized**
```json
{
  "success": false,
  "message": "No autenticado."
}
```

### **403 - Forbidden**
```json
{
  "success": false,
  "message": "No tienes permisos para usar la aplicación móvil."
}
```

### **422 - Validation Error**
```json
{
  "success": false,
  "message": "Datos de ubicación inválidos.",
  "errors": {
    "latitude": ["La latitud es requerida."],
    "longitude": ["La longitud debe estar entre -180 y 180 grados."]
  }
}
```

### **500 - Server Error**
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Database connection failed"
}
```

---

## 🔗 **ENDPOINTS COMPLETOS**

### **Autenticación**
- `POST /api/auth/login`
- `POST /api/auth/logout` 🔒
- `GET /api/auth/profile` 🔒
- `POST /api/auth/refresh-token` 🔒

### **Jornadas Laborales**
- `POST /api/working-sessions/start` 🔒
- `POST /api/working-sessions/end` 🔒
- `POST /api/working-sessions/pause` 🔒
- `POST /api/working-sessions/resume` 🔒
- `GET /api/working-sessions/current` 🔒
- `GET /api/working-sessions/history` 🔒

### **Tracking GPS**
- `POST /api/gps/location` 🔒
- `POST /api/gps/batch-locations` 🔒
- `GET /api/gps/my-route-today` 🔒

### **Visitas PDV**
- `POST /api/pdv-visits/check-in` 🔒
- `POST /api/pdv-visits/check-out` 🔒
- `POST /api/pdv-visits/upload-photo` 🔒
- `GET /api/pdv-visits/my-visits-today` 🔒
- `GET /api/pdv-visits/visit/{id}` 🔒

### **Datos del Usuario**
- `GET /api/user/circuits` 🔒
- `GET /api/user/pdvs-today` 🔒
- `GET /api/user/pdvs-by-circuit/{circuit}` 🔒
- `GET /api/user/stats` 🔒

### **Dashboard (Solo Supervisores/Admins)**
- `GET /api/dashboard/real-time-locations` 🔒
- `GET /api/dashboard/user/{user}/route` 🔒
- `GET /api/dashboard/stats/general` 🔒
- `GET /api/dashboard/active-vendors` 🔒

---

## 🧪 **EJEMPLO DE FLUJO COMPLETO**

### 1. **Login**
```bash
curl -X POST "https://tu-dominio.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "vendedor01",
    "password": "password123",
    "device_name": "iPhone 13 - Juan"
  }'
```

### 2. **Iniciar Jornada**
```bash
curl -X POST "https://tu-dominio.com/api/working-sessions/start" \
  -H "Authorization: Bearer 1|abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -12.046374,
    "longitude": -77.042793
  }'
```

### 3. **Enviar Ubicación GPS**
```bash
curl -X POST "https://tu-dominio.com/api/gps/location" \
  -H "Authorization: Bearer 1|abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -12.046374,
    "longitude": -77.042793,
    "accuracy": 5.0,
    "battery_level": 85
  }'
```

### 4. **Check-in en PDV**
```bash
curl -X POST "https://tu-dominio.com/api/pdv-visits/check-in" \
  -H "Authorization: Bearer 1|abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "pdv_id": 789,
    "latitude": -12.046374,
    "longitude": -77.042793
  }'
```

---

🔒 = **Requiere autenticación Bearer Token**

**¡Tu sistema de APIs está listo para la aplicación móvil!** 🚀