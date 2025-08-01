import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { X, User as UserIcon, CircuitBoard, Activity, BarChart3, History, Navigation } from 'lucide-react';
import type { User, UserStats } from '@/types/tracking';

interface TrackingUserDetailsProps {
    selectedUser: User;
    userStats: Record<number, UserStats>;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onClose: () => void;
    onLoadRoute: (user: User) => void;
}

export default function TrackingUserDetails({
    selectedUser,
    userStats,
    activeTab,
    onTabChange,
    onClose,
    onLoadRoute
}: TrackingUserDetailsProps) {
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
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Detalles del Vendedor</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    {/* Información básica */}
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                     <UserIcon className="w-5 h-5 text-blue-600" />
                                 </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                </div>
                                {getStatusBadge(getUserStatus(selectedUser))}
                            </div>

                            {selectedUser.active_user_circuits?.[0] && (
                                <div>
                                    <p className="text-xs text-gray-600">Circuito asignado</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CircuitBoard className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium">
                                            {selectedUser.active_user_circuits[0].circuit.code ?
                                                `${selectedUser.active_user_circuits[0].circuit.code} - ` : ''
                                            }{selectedUser.active_user_circuits[0].circuit.name}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Estadísticas del período */}
                    {userStats[selectedUser.id] && (
                        <Card className="mb-4">
                            <CardContent className="p-4">
                                <Tabs value={activeTab} onValueChange={onTabChange}>
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                        <TabsTrigger value="stats">Stats</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-4 mt-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    Cumplimiento del Período
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Progreso</span>
                                                    <span className="text-lg font-semibold text-blue-600">
                                                        {userStats[selectedUser.id].compliance_percentage}%
                                                    </span>
                                                </div>

                                                <Progress
                                                    value={userStats[selectedUser.id].compliance_percentage}
                                                    className="h-2"
                                                />

                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">PDVs visitados</p>
                                                        <p className="font-semibold">{userStats[selectedUser.id].pdv_visits}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">PDVs programados</p>
                                                        <p className="font-semibold">{userStats[selectedUser.id].programmed_pdvs}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Horas trabajadas</p>
                                                        <p className="font-semibold">{userStats[selectedUser.id].working_hours}h</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Distancia</p>
                                                        <p className="font-semibold">{userStats[selectedUser.id].distance_traveled}km</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="timeline" className="space-y-4 mt-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Línea de Tiempo
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {userStats[selectedUser.id].pdv_visits_detail.map((visit, index) => (
                                                        <div key={index} className="flex items-start gap-3 border-l-2 border-blue-200 pl-3">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{visit.pdv}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {visit.visited_at}
                                                                    {visit.duration && ` (${visit.duration} min)`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {userStats[selectedUser.id].pdv_visits_detail.length === 0 && (
                                                        <div className="text-center py-4 text-gray-500">
                                                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm">No hay visitas registradas</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="stats" className="space-y-4 mt-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" />
                                                    Estadísticas Detalladas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                            <p className="text-blue-600 font-semibold text-lg">
                                                                {userStats[selectedUser.id].total_sessions}
                                                            </p>
                                                            <p className="text-gray-600">Sesiones</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                                            <p className="text-green-600 font-semibold text-lg">
                                                                {userStats[selectedUser.id].working_hours}h
                                                            </p>
                                                            <p className="text-gray-600">Horas</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => onLoadRoute(selectedUser)}
                                                            className="w-full flex items-center gap-2"
                                                        >
                                                            <Navigation className="w-4 h-4" />
                                                            Ver ruta del día
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
