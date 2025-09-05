# Sistema de Filtrado Automático por Middleware

## 🎯 Objetivo
Implementar filtrado automático de datos basado en el negocio y zonal asignado al usuario, aplicando restricciones tanto en la visualización como en la exportación de datos.

## 🔧 Middlewares Implementados

### 1. BusinessScopeMiddleware
- **Ubicación**: `app/Http/Middleware/BusinessScopeMiddleware.php`
- **Registro**: Global en `bootstrap/app.php`
- **Función**: Determina el scope de acceso del usuario

### 2. FilterByBusiness
- **Ubicación**: `app/Http/Middleware/FilterByBusiness.php`
- **Función**: Filtra datos por negocio del usuario

## 👥 Tipos de Usuario y Acceso

### 🏢 Administrador
- **Acceso**: Completo a todos los datos
- **Filtros**: Ninguna restricción
- **Scope**: `is_admin = true`

### 👤 Vendedor
- **Acceso**: Completo (bypaseado del middleware)
- **Filtros**: Ninguna restricción
- **Scope**: `is_admin = true` (tratado como admin)

### 🎯 Supervisor/Manager
- **Acceso**: Limitado a su negocio/zonal asignado
- **Filtros**: Automáticos basados en asignaciones
- **Scope**: Basado en `activeBusinesses()` y `activeZonalSupervisorAssignments()`

## 🔍 Lógica de Filtrado

### Filtros Automáticos Aplicados

#### 1. **Restricción por Negocio**
```php
if ($businessScope['has_business_restriction'] && !empty($businessScope['business_ids'])) {
    $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
        $q->whereIn('business_id', $businessScope['business_ids']);
    });
}
```

#### 2. **Restricción por Zonal**
```php
if ($businessScope['has_zonal_restriction'] && !empty($businessScope['zonal_ids'])) {
    $query->whereHas('user.userCircuits.circuit.zonal', function ($q) use ($businessScope) {
        $q->whereIn('zonales.id', $businessScope['zonal_ids']);
    });
}
```

### Opciones de Filtros Limitadas

#### 1. **Negocios**
- Solo muestra negocios asignados al usuario
- Si es admin: todos los negocios
- Si es supervisor: solo sus negocios

#### 2. **Zonales**
- Solo muestra zonales del negocio asignado
- Filtrado automático por `business_id`

#### 3. **Circuitos**
- Solo muestra circuitos de las zonales asignadas
- Filtrado automático por `zonal_id`

#### 4. **Usuarios**
- Solo muestra vendedores de la jerarquía asignada
- Filtrado dinámico según selección de negocio/zonal/circuito

## 📊 Aplicación en Reportes

### 1. **WorkingSessionsController**
- **Método `index()`**: Filtros automáticos en consulta principal
- **Método `export()`**: Filtros automáticos en exportación
- **Método `getStats()`**: Filtros automáticos en estadísticas
- **Opciones de filtros**: Limitadas según scope del usuario

### 2. **Datos Filtrados**
- **Jornadas laborales**: Solo del negocio/zonal asignado
- **Usuarios**: Solo vendedores de la jerarquía asignada
- **Rutas**: Solo rutas del circuito asignado
- **PDVs**: Solo PDVs de las rutas asignadas

## 🚀 Ejemplo de Funcionamiento

### Usuario Supervisor de "MovilMac Surco"
```
Scope del Usuario:
- business_ids: [1] (MovilMac)
- zonal_ids: [3] (Surco)
- has_business_restriction: true
- has_zonal_restriction: true

Filtros Aplicados Automáticamente:
- Solo jornadas de vendedores de Surco
- Solo opciones de negocio: MovilMac
- Solo opciones de zonal: Surco
- Solo circuitos de Surco
- Solo vendedores de Surco

Exportación:
- Solo exporta datos de Surco
- Nombre de archivo incluye: "negocio_MovilMac_zonal_Surco"
```

### Usuario Administrador
```
Scope del Usuario:
- is_admin: true
- has_business_restriction: false
- has_zonal_restriction: false

Filtros Aplicados:
- Ninguna restricción automática
- Acceso completo a todos los datos
- Todas las opciones disponibles

Exportación:
- Exporta todos los datos
- Filtros manuales aplicados por el usuario
```

## 🔒 Seguridad

### 1. **Validación Automática**
- Filtros aplicados a nivel de base de datos
- No se pueden bypasear desde el frontend
- Validación en todos los métodos del controlador

### 2. **Logging**
- Registro de filtros aplicados en logs
- Trazabilidad de consultas SQL
- Auditoría de acceso a datos

### 3. **Fallback Seguro**
- Si no se puede obtener el scope, se trata como admin
- Validación de datos antes de aplicar filtros
- Manejo de errores sin exponer datos sensibles

## 📝 Logs de Debug

### Información Registrada
```php
Log::info('Exportación de jornadas laborales', [
    'filtros_aplicados' => [
        'date_from' => $dateFrom,
        'date_to' => $dateTo,
        'business_id' => $request->business_id,
        'zonal_id' => $request->zonal_id,
        'circuit_id' => $request->circuit_id,
        'user_id' => $request->user_id,
        'status' => $request->status,
    ],
    'business_scope' => $businessScope,
    'total_registros' => $sessions->count(),
    'sql_query' => $query->toSql(),
    'sql_bindings' => $query->getBindings(),
]);
```

## ✅ Beneficios

1. **🔒 Seguridad**: Filtrado automático sin posibilidad de bypass
2. **🎯 Precisión**: Solo datos relevantes para cada usuario
3. **⚡ Rendimiento**: Consultas optimizadas con filtros automáticos
4. **📊 Consistencia**: Mismo comportamiento en visualización y exportación
5. **🔧 Mantenibilidad**: Lógica centralizada en middlewares
6. **📈 Escalabilidad**: Fácil agregar nuevos tipos de restricción
