import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Users } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: boolean;
}

interface Business {
    id: number;
    name: string;
    status: boolean;
    active_users?: User[];
}

interface Props {
    business: Business;
    users: User[];
    mode: 'assign' | 'reassign';
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function UserAssignmentModal({ business, users, mode, onClose, onSuccess, onError }: Props) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mostrar todos los usuarios activos, incluyendo los ya asignados a otros negocios
    // Solo excluir usuarios ya asignados a ESTE negocio específico
    const availableUsers = users.filter(user =>
        !business.active_users?.some(activeUser => activeUser.id === user.id)
    );

    // Función para verificar si un usuario está asignado a otros negocios
    const getUserBusinessCount = (userId: number): number => {
        // Esta información podría venir del backend en una futura optimización
        // Por ahora mostramos que es posible asignar a múltiples negocios
        return 0;
    };



    const handleSubmit = () => {
        if (!selectedUserId) {
            onError('Debes seleccionar un usuario');
            return;
        }

        setIsSubmitting(true);

        const formData = {
            business_id: parseInt(business.id.toString()),
            user_id: parseInt(selectedUserId),
            notes: notes,
            assignment_data: {
                assigned_by: 'admin',
                reason: mode === 'assign' ? 'new_assignment' : 'reassignment'
            }
        };

        router.post('/admin/business-users', formData, {
            onSuccess: () => {
                onSuccess('Usuario asignado exitosamente');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ');
                onError(errorMessage || 'Error al asignar usuario');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md border-0 shadow-xl">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2 text-gray-800">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        {mode === 'assign' ? 'Asignar Usuario' : 'Reasignar Usuario'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        {mode === 'assign'
                            ? `Asignar un usuario al negocio "${business.name}"`
                            : `Reasignar usuarios al negocio "${business.name}"`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="user" className="text-sm font-medium text-gray-700">Usuario</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.length > 0 ? (
                                    availableUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.first_name} {user.last_name} ({user.email})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>
                                        No hay usuarios disponibles
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {availableUsers.length === 0 && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-700">
                                    No hay usuarios disponibles para asignar
                                </p>
                            </div>
                        )}
                        {availableUsers.length > 0 && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700">
                                    {availableUsers.length} usuario(s) disponible(s) para asignar
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    💡 Un usuario puede estar asignado a múltiples negocios
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Agregar notas sobre la asignación..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>
                </div>

                                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || availableUsers.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                    >
                        {isSubmitting ? 'Asignando...' : 'Asignar Usuario'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
