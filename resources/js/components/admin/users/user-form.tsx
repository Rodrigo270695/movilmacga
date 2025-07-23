import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { router } from '@inertiajs/react';
import { useState, FormEvent, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    dni: string;
    phone_number?: string;
    roles: Role[];
}

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    roles: Role[];
}

export function UserForm({ isOpen, onClose, user, roles }: UserFormProps) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        dni: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
    });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Resetear formulario cuando cambia el usuario o se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            if (user) {
                // Modo edición
                setFormData({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    dni: user.dni,
                    phone_number: user.phone_number || '',
                    password: '',
                    password_confirmation: '',
                });
                setSelectedRoles(user.roles.map(r => r.name));
            } else {
                // Modo creación
                setFormData({
                    first_name: '',
                    last_name: '',
                    username: '',
                    email: '',
                    dni: '',
                    phone_number: '',
                    password: '',
                    password_confirmation: '',
                });
                setSelectedRoles([]);
            }
            setErrors({});
        }
    }, [isOpen, user]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Validaciones básicas
        const newErrors: Record<string, string> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'El nombre es requerido';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'El apellido es requerido';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'El nombre de usuario es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        }

        if (!formData.dni.trim()) {
            newErrors.dni = 'El DNI es requerido';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        const url = user
            ? route('admin.users.update', user.id)
            : route('admin.users.store');

        const method = user ? 'patch' : 'post';

        // Preparar datos para envío
        const submitData = { ...formData, roles: selectedRoles };

        // Si es edición y no se cambió la contraseña, no enviarla
        if (user && !submitData.password) {
            delete submitData.password;
            delete submitData.password_confirmation;
        }

        router[method](url, submitData, {
            preserveScroll: true,
            onSuccess: () => {
                const action = user ? 'actualizado' : 'creado';
                addToast({
                    type: 'success',
                    title: '¡Éxito!',
                    message: `Usuario ${action} exitosamente.`,
                    duration: 4000
                });
                handleClose();
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Por favor corrige los errores en el formulario.',
                    duration: 4000
                });
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const handleRoleToggle = (roleName: string) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleName)) {
                return prev.filter(r => r !== roleName);
            } else {
                return [...prev, roleName];
            }
        });
    };

    const handleSelectAllRoles = () => {
        setSelectedRoles(roles.map(r => r.name));
    };

    const handleDeselectAllRoles = () => {
        setSelectedRoles([]);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando se modifica
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-2xl max-w-[95vw] mx-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-left pb-2">
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        {user
                            ? 'Modifica la información del usuario. Los roles se gestionan por separado.'
                            : 'Completa la información para crear un nuevo usuario del sistema.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombres */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                                Nombres <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                placeholder="Ej: Juan Carlos"
                                className={`${errors.first_name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                maxLength={25}
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-600">{errors.first_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                                Apellidos <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                placeholder="Ej: Pérez García"
                                className={`${errors.last_name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                maxLength={25}
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-600">{errors.last_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Username y DNI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                                Nombre de Usuario <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                                placeholder="Ej: jperez"
                                className={`${errors.username
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                maxLength={25}
                            />
                            {errors.username && (
                                <p className="text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni" className="text-sm font-medium text-gray-700">
                                DNI <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="dni"
                                type="text"
                                value={formData.dni}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, ''); // Solo números
                                    if (value.length <= 8) {
                                        handleInputChange('dni', value);
                                    }
                                }}
                                placeholder="12345678"
                                className={`${errors.dni
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                maxLength={8}
                            />
                            {errors.dni && (
                                <p className="text-sm text-red-600">{errors.dni}</p>
                            )}
                        </div>
                    </div>

                    {/* Email y Teléfono */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Correo Electrónico <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                                placeholder="usuario@empresa.com"
                                className={`${errors.email
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                                Teléfono
                            </Label>
                            <Input
                                id="phone_number"
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                placeholder="987654321"
                                className={`${errors.phone_number
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                maxLength={15}
                            />
                            {errors.phone_number && (
                                <p className="text-sm text-red-600">{errors.phone_number}</p>
                            )}
                        </div>
                    </div>

                    {/* Contraseñas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                {user ? 'Nueva Contraseña' : 'Contraseña'}
                                {!user && <span className="text-red-500"> *</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder={user ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                                className={`${errors.password
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                minLength={6}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                Confirmar Contraseña
                                {!user && <span className="text-red-500"> *</span>}
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={formData.password_confirmation}
                                onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                placeholder="Repetir contraseña"
                                className={`${errors.password_confirmation
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                disabled={isSubmitting}
                                minLength={6}
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                            )}
                        </div>
                    </div>

                    {/* Selección de Roles */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                                Roles del Usuario
                            </Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllRoles}
                                    className="text-xs cursor-pointer h-7"
                                    disabled={isSubmitting}
                                >
                                    Todos
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeselectAllRoles}
                                    className="text-xs cursor-pointer h-7"
                                    disabled={isSubmitting}
                                >
                                    Ninguno
                                </Button>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                            {roles.length > 0 ? (
                                <div className="space-y-2">
                                    {roles.map((role) => {
                                        const isSelected = selectedRoles.includes(role.name);

                                        return (
                                            <div
                                                key={role.id}
                                                className={`border rounded-lg p-2 transition-colors ${
                                                    isSelected
                                                        ? 'border-purple-200 bg-purple-50'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            >
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => !isSubmitting && handleRoleToggle(role.name)}
                                                        className="border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 cursor-pointer"
                                                        disabled={isSubmitting}
                                                    />
                                                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                                                        <Shield className="w-3 h-3 text-purple-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 flex-1">
                                                        {role.name}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay roles disponibles</p>
                                </div>
                            )}
                        </div>

                        {/* Preview de roles seleccionados */}
                        {selectedRoles.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-2">Roles seleccionados:</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedRoles.map((roleName) => (
                                        <Badge
                                            key={roleName}
                                            variant="secondary"
                                            className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                        >
                                            {roleName}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto cursor-pointer order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer order-1 sm:order-2"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{user ? 'Actualizando...' : 'Creando...'}</span>
                                </div>
                            ) : (
                                <span>{user ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
