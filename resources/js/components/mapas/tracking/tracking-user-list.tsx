import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, User as UserIcon } from 'lucide-react';
import type { User, UserStats } from '@/types/tracking';

interface TrackingUserListProps {
    users: User[];
    userStats: Record<number, UserStats>;
    selectedUser: User | null;
    vendorListExpanded: boolean;
    onUserSelect: (user: User) => void;
    onToggleExpanded: () => void;
}

export default function TrackingUserList({
    users,
    userStats,
    selectedUser,
    vendorListExpanded,
    onUserSelect,
    onToggleExpanded
}: TrackingUserListProps) {
    // Determinar estado del usuario
    const getUserStatus = (user: User) => {
        const hasActiveSessions = user.active_working_sessions && user.active_working_sessions.length > 0;
        return hasActiveSessions ? 'online' : 'offline';
    };

    // Badge de estado
    const getStatusBadge = (status: string) => {
        if (status === 'online') {
            return <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>;
        }
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desconectado</Badge>;
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                 <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                     <UserIcon className="w-4 h-4" />
                     Vendedores ({users.length})
                 </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleExpanded}
                    className="p-1"
                >
                    {vendorListExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
            </div>

            {vendorListExpanded && (
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 space-y-2">
                        {users.map((user) => {
                            const status = getUserStatus(user);
                            const stats = userStats[user.id];

                            return (
                                <Card
                                    key={user.id}
                                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                                        selectedUser?.id === user.id
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => onUserSelect(user)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </h4>

                                                <div className="flex items-center gap-2 mt-1">
                                                    {getStatusBadge(status)}
                                                </div>

                                                <p className="text-xs text-gray-600 mb-2">{user.email}</p>

                                                {user.active_user_circuits?.[0] && (
                                                    <p className="text-xs text-blue-600 mb-2">
                                                        {user.active_user_circuits[0].circuit.name}
                                                    </p>
                                                )}

                                                {stats && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-600">Cumplimiento</span>
                                                            <span className="font-medium">{stats.compliance_percentage}%</span>
                                                        </div>

                                                        <Progress
                                                            value={stats.compliance_percentage}
                                                            className="h-1"
                                                        />

                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>{stats.pdv_visits}/{stats.programmed_pdvs} PDVs</span>
                                                            <span>{stats.distance_traveled} km</span>
                                                        </div>

                                                        <p className="text-xs text-gray-500">
                                                            <Clock className="w-3 h-3 inline mr-1" />
                                                            {stats.last_activity}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                                                 {users.length === 0 && (
                             <div className="text-center py-8 text-gray-500">
                                 <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                 <p className="text-sm">No hay vendedores que coincidan con los filtros</p>
                             </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
}
