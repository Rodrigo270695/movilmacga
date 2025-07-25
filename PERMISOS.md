# 🔐 Sistema de Roles y Permisos - Laravel Permission

## 📋 Roles y Permisos Instalados

### Rol Inicial
- **👑 Administrador** - Acceso completo al sistema (todos los permisos)

> **Nota:** Los demás roles se crearán dinámicamente desde la interfaz web, donde podrás asignar permisos específicos a cada nuevo rol mediante checkboxes.

### Permisos Disponibles

#### 🏠 **Dashboard**
- `menu-dashboard` - Acceso al menú del dashboard
- `ver-dashboard` - Ver el dashboard principal
- `ver-estadisticas` - Ver estadísticas del sistema

#### 👥 **Gestión de Usuarios**
- `gestor-usuarios-acceso` - Acceso al módulo de usuarios
- `gestor-usuarios-ver` - Listar y ver usuarios
- `gestor-usuarios-crear` - Crear nuevos usuarios
- `gestor-usuarios-editar` - Editar usuarios existentes
- `gestor-usuarios-eliminar` - Eliminar usuarios
- `gestor-usuarios-cambiar-estado` - Activar/desactivar usuarios

#### 🛡️ **Gestión de Roles y Permisos**
- `gestor-roles-acceso` - Acceso al módulo de roles
- `gestor-roles-ver` - Listar y ver roles
- `gestor-roles-crear` - Crear nuevos roles
- `gestor-roles-editar` - Editar roles existentes
- `gestor-roles-eliminar` - Eliminar roles
- `gestor-roles-cambiar-estado` - Activar/desactivar roles
- `gestor-roles-asignar-permisos` - Asignar permisos a roles

#### 📁 **Gestión de Zonales (DCS)**
- `gestor-zonal-acceso` - Acceso al módulo de zonales
- `gestor-zonal-ver` - Listar y ver zonales
- `gestor-zonal-crear` - Crear nuevos zonales
- `gestor-zonal-editar` - Editar zonales existentes
- `gestor-zonal-eliminar` - Eliminar zonales
- `gestor-zonal-cambiar-estado` - Activar/desactivar zonales

#### 🔌 **Gestión de Circuitos (DCS)**
- `gestor-circuito-acceso` - Acceso al módulo de circuitos
- `gestor-circuito-ver` - Listar y ver circuitos
- `gestor-circuito-crear` - Crear nuevos circuitos
- `gestor-circuito-editar` - Editar circuitos existentes
- `gestor-circuito-eliminar` - Eliminar circuitos
- `gestor-circuito-cambiar-estado` - Activar/desactivar circuitos

#### 🛤️ **Gestión de Rutas (DCS)**
- `gestor-ruta-acceso` - Acceso al módulo de rutas
- `gestor-ruta-ver` - Listar y ver rutas
- `gestor-ruta-crear` - Crear nuevas rutas
- `gestor-ruta-editar` - Editar rutas existentes
- `gestor-ruta-eliminar` - Eliminar rutas
- `gestor-ruta-cambiar-estado` - Activar/desactivar rutas

#### ⚙️ **Configuración del Sistema**
- `configuracion-acceso` - Acceso al módulo de configuración
- `configuracion-general` - Configuración general del sistema
- `configuracion-seguridad` - Configuración de seguridad

#### 🚀 **Menús de Navegación**
- `menu-admin` - Acceso al menú de administración
- `menu-dcs` - Acceso al menú DCS

## 👥 Usuario Administrador Inicial

### 👑 Administrador
- **🆔 DNI:** 12345678
- **👤 Nombres:** Admin
- **👥 Apellidos:** Sistema
- **🏷️ Usuario:** admin
- **📧 Email:** admin@movilmacga.com (solo para recuperación de contraseña)
- **🔒 Password:** password123
- **📱 Teléfono:** No asignado
- **✅ Estado:** Activo
- **🎭 Rol:** Administrador
- **✅ Permisos:** Todos (13 permisos disponibles)

> **📝 Nota:** El login se realiza con **username** y contraseña. El email solo se usa para recuperación de contraseña.
> 
> **🚫 Registro deshabilitado:** No hay página de registro. Los nuevos usuarios deben ser creados por administradores desde la interfaz web.

## 🔧 Uso en el Código

### Verificar Permisos en Controladores

```php
// Verificar si el usuario tiene un permiso específico
if (auth()->user()->can('ver-usuarios')) {
    // El usuario puede ver usuarios
}

// Verificar si el usuario tiene un rol específico
if (auth()->user()->hasRole('Administrador')) {
    // El usuario es administrador
}

// Verificar múltiples permisos
if (auth()->user()->hasAnyPermission(['crear-usuarios', 'editar-usuarios'])) {
    // El usuario puede crear o editar usuarios
}
```

### Middleware de Permisos

```php
// En routes/web.php
Route::middleware(['auth', 'permission:ver-usuarios'])->group(function () {
    Route::get('/usuarios', [UserController::class, 'index']);
});

// Middleware de rol
Route::middleware(['auth', 'role:Administrador'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index']);
});
```

### En Blade/React Components

```php
// En controladores para pasar a React
public function index()
{
    return Inertia::render('Dashboard', [
        'can' => [
            'ver_usuarios' => auth()->user()->can('ver-usuarios'),
            'crear_usuarios' => auth()->user()->can('crear-usuarios'),
            'es_admin' => auth()->user()->hasRole('Administrador'),
        ]
    ]);
}
```

```jsx
// En componentes React
export default function Dashboard({ can }) {
    return (
        <div>
            {can.ver_usuarios && (
                <Link href="/usuarios">Ver Usuarios</Link>
            )}
            
            {can.crear_usuarios && (
                <button>Crear Usuario</button>
            )}
            
            {can.es_admin && (
                <div>Panel de Administrador</div>
            )}
        </div>
    );
}
```

### Gestión de Roles y Permisos

```php
// Asignar rol a usuario
$user = User::find(1);
$user->assignRole('Editor');

// Asignar permiso directo a usuario
$user->givePermissionTo('ver-configuracion');

// Quitar rol
$user->removeRole('Editor');

// Quitar permiso
$user->revokePermissionTo('ver-configuracion');

// Sincronizar roles (quita los existentes y asigna solo estos)
$user->syncRoles(['Administrador']);

// Crear nuevo permiso
Permission::create(['name' => 'nuevo-permiso']);

// Crear nuevo rol
$role = Role::create(['name' => 'Nuevo Rol']);
$role->givePermissionTo(['permiso1', 'permiso2']);
```

## 🛡️ Protección en Frontend (React)

### Hook personalizado para permisos

```jsx
// hooks/usePermissions.js
import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { can } = usePage().props;
    
    const hasPermission = (permission) => {
        return can[permission] || false;
    };
    
    const hasRole = (role) => {
        return can[`es_${role.toLowerCase()}`] || false;
    };
    
    return { hasPermission, hasRole };
}
```

### Componente de protección

```jsx
// components/ProtectedComponent.jsx
export function ProtectedComponent({ permission, role, children, fallback = null }) {
    const { hasPermission, hasRole } = usePermissions();
    
    if (permission && !hasPermission(permission)) {
        return fallback;
    }
    
    if (role && !hasRole(role)) {
        return fallback;
    }
    
    return children;
}

// Uso
<ProtectedComponent permission="crear_usuarios">
    <button>Crear Usuario</button>
</ProtectedComponent>
```

## 📊 Comandos Útiles

```bash
# Limpiar caché de permisos
php artisan permission:cache-reset

# Ver todos los permisos
php artisan permission:show

# Crear nuevos roles y permisos
php artisan db:seed --class=RolePermissionSeeder

# Refrescar base de datos y seeders
php artisan migrate:fresh --seed
```

## 🔍 Verificar Configuración

```bash
# Ver tablas creadas
php artisan tinker
>>> \Schema::hasTable('permissions')
>>> \Schema::hasTable('roles')
>>> \Schema::hasTable('model_has_permissions')
>>> \Schema::hasTable('model_has_roles')
>>> \Schema::hasTable('role_has_permissions')

# Ver usuarios con roles
>>> App\Models\User::with('roles')->get()

# Ver permisos de un usuario
>>> $user = App\Models\User::first()
>>> $user->getAllPermissions()
>>> $user->getRoleNames()
```

## 🎯 Crear Interfaz de Gestión de Roles

### Controlador para Gestionar Roles

```php
// app/Http/Controllers/RoleController.php
public function create()
{
    $permissions = Permission::all()->groupBy(function ($permission) {
        return explode('-', $permission->name)[0]; // Agrupa por prefijo
    });
    
    return Inertia::render('Admin/CreateRole', [
        'permissions' => $permissions
    ]);
}

public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string|unique:roles,name',
        'permissions' => 'array'
    ]);

    $role = Role::create(['name' => $request->name]);
    
    if ($request->permissions) {
        $role->givePermissionTo($request->permissions);
    }

    return redirect()->route('roles.index')
        ->with('success', 'Rol creado exitosamente');
}
```

### Componente React para Crear Roles

```jsx
// resources/js/pages/Admin/CreateRole.tsx
import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function CreateRole({ permissions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: []
    });

    const handlePermissionChange = (permissionName, checked) => {
        const newPermissions = checked 
            ? [...data.permissions, permissionName]
            : data.permissions.filter(p => p !== permissionName);
        
        setData('permissions', newPermissions);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Crear Nuevo Rol</h1>
            
            <form onSubmit={submit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Nombre del Rol
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Ej: Editor, Moderador, etc."
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Permisos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(permissions).map(([category, categoryPermissions]) => (
                            <div key={category} className="border rounded-lg p-4">
                                <h4 className="font-medium mb-3 capitalize">
                                    {category.replace('-', ' ')}
                                </h4>
                                <div className="space-y-2">
                                    {categoryPermissions.map(permission => (
                                        <label key={permission.name} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.permissions.includes(permission.name)}
                                                onChange={e => handlePermissionChange(
                                                    permission.name, 
                                                    e.target.checked
                                                )}
                                                className="rounded"
                                            />
                                            <span className="text-sm">
                                                {permission.name.replace('-', ' ').replace(category, '').trim()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {processing ? 'Creando...' : 'Crear Rol'}
                    </button>
                </div>
            </form>
        </div>
    );
}
```

### Rutas Necesarias

```php
// routes/web.php
Route::middleware(['auth', 'role:Administrador'])->group(function () {
    Route::resource('roles', RoleController::class);
    Route::get('users/{user}/assign-role', [UserController::class, 'assignRoleForm']);
    Route::post('users/{user}/assign-role', [UserController::class, 'assignRole']);
});
```

## 🎯 Próximos Pasos

1. **✅ Crear interfaz de gestión de roles** - Con checkboxes para asignar permisos
2. **Gestión de usuarios** - Asignar roles creados a usuarios específicos
3. **Lista de roles** - Ver todos los roles y sus permisos
4. **Editar roles** - Modificar permisos de roles existentes
5. **Middleware personalizado** - Proteger rutas específicas de tu aplicación

---

¡El sistema base está listo! Ahora puedes crear roles dinámicamente desde la interfaz web 🚀 
