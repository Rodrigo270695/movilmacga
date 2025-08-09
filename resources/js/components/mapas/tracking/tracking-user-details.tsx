import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { X, User as UserIcon, CircuitBoard, Activity, BarChart3, History, Navigation, Clock, MapPin, Camera, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { User, UserStats, PdvVisit } from '@/types/tracking';
import { useState, useEffect } from 'react';

interface TrackingUserDetailsProps {
    selectedUser: User;
    userStats: Record<number, UserStats>;
    activeTab: string;
    currentDate: string; // Agregar fecha actual para filtros
    onTabChange: (tab: string) => void;
    onClose: () => void;
    onLoadRoute: (user: User) => void;
}

export default function TrackingUserDetails({
    selectedUser,
    userStats,
    activeTab,
    currentDate,
    onTabChange,
    onClose,
    onLoadRoute
}: TrackingUserDetailsProps) {

    // Estado para PDV visits
    const [pdvVisits, setPdvVisits] = useState<PdvVisit[]>([]);
    const [loadingPdvVisits, setLoadingPdvVisits] = useState(false);
    const [pdvVisitsStats, setPdvVisitsStats] = useState({
        total: 0,
        completed: 0,
        in_progress: 0
    });

    // Función para obtener PDV visits
    const fetchPdvVisits = async () => {
        setLoadingPdvVisits(true);
        try {
            const response = await fetch(route('mapas.tracking.users.pdv-visits', {
                user: selectedUser.id,
                date_from: currentDate,
                date_to: currentDate
            }));

            if (response.ok) {
                const data = await response.json();
                setPdvVisits(data.pdv_visits || []);
                setPdvVisitsStats({
                    total: data.total_visits || 0,
                    completed: data.completed_visits || 0,
                    in_progress: data.in_progress_visits || 0
                });
                console.log('📋 PDV Visits loaded:', data);
            } else {
                console.error('❌ Error loading PDV visits:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error fetching PDV visits:', error);
        } finally {
            setLoadingPdvVisits(false);
        }
    };

    // Cargar PDV visits cuando cambie el usuario o la fecha
    useEffect(() => {
        if (selectedUser && activeTab === 'timeline') {
            fetchPdvVisits();
        }
    }, [selectedUser.id, currentDate, activeTab]);
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

    // Función para obtener icono según el estado de la visita
    const getVisitStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'in_progress':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    // Función para obtener el color del badge según el estado
    const getVisitStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 border-green-200">{label}</Badge>;
            case 'in_progress':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{label}</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 border-red-200">{label}</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{label}</Badge>;
        }
    };

    // Formatear fecha para mostrar
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        };
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
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
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
                                        {/* Estadísticas de visitas */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <Card className="p-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-blue-600">{pdvVisitsStats.total}</div>
                                                    <div className="text-xs text-gray-500">Total</div>
                                                </div>
                                            </Card>
                                            <Card className="p-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-600">{pdvVisitsStats.completed}</div>
                                                    <div className="text-xs text-gray-500">Completadas</div>
                                                </div>
                                            </Card>
                                            <Card className="p-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-yellow-600">{pdvVisitsStats.in_progress}</div>
                                                    <div className="text-xs text-gray-500">En progreso</div>
                                                </div>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Visitas de PDV ({currentDate})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {loadingPdvVisits ? (
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                        <p className="text-sm text-gray-500 mt-2">Cargando visitas...</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                                        {pdvVisits.map((visit, index) => {
                                                            const checkInTime = formatDateTime(visit.check_in_at);
                                                            const checkOutTime = visit.check_out_at ? formatDateTime(visit.check_out_at) : null;

                                                            return (
                                                                <div key={visit.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                                                    {/* Header con PDV y estado */}
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                {getVisitStatusIcon(visit.visit_status)}
                                                                                <h4 className="text-sm font-semibold text-gray-900">
                                                                                    {visit.pdv.point_name}
                                                                                </h4>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">
                                                                                {visit.pdv.client_name} • {visit.pdv.address}
                                                                            </p>
                                                                        </div>
                                                                        {getVisitStatusBadge(visit.visit_status, visit.visit_status_label)}
                                                                    </div>

                                                                    {/* Foto de la visita */}
                                                                    {visit.visit_photo && (
                                                                        <div className="flex justify-center">
                                                                            <div className="relative">
                                                                                <img
                                                                                    src={visit.visit_photo}
                                                                                    alt={`Visita a ${visit.pdv.point_name}`}
                                                                                    className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200"
                                                                                />
                                                                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                                                                                    <Camera className="w-3 h-3 text-white" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Información de tiempo */}
                                                                    <div className="space-y-2 bg-gray-50 p-2 rounded">
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <Clock className="w-3 h-3 text-gray-500" />
                                                                            <span className="text-gray-600">Check-in:</span>
                                                                            <span className="font-medium text-gray-900">{checkInTime.time}</span>
                                                                        </div>

                                                                        {checkOutTime && (
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <Clock className="w-3 h-3 text-gray-500" />
                                                                                <span className="text-gray-600">Check-out:</span>
                                                                                <span className="font-medium text-gray-900">{checkOutTime.time}</span>
                                                                            </div>
                                                                        )}

                                                                        {visit.duration_minutes && (
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <History className="w-3 h-3 text-gray-500" />
                                                                                <span className="text-gray-600">Duración:</span>
                                                                                <span className="font-medium text-blue-600">{visit.duration_formatted}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Información adicional */}
                                                                    {(visit.distance_to_pdv || visit.notes) && (
                                                                        <div className="space-y-1 text-xs">
                                                                            {visit.distance_to_pdv && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <MapPin className="w-3 h-3 text-gray-500" />
                                                                                    <span className="text-gray-600">Distancia:</span>
                                                                                    <span className="font-medium">{visit.distance_to_pdv.toFixed(0)}m</span>
                                                                                </div>
                                                                            )}
                                                                            {visit.notes && (
                                                                                <div className="flex items-start gap-2">
                                                                                    <div className="w-3 h-3 mt-0.5">📝</div>
                                                                                    <span className="text-gray-600 flex-1">{visit.notes}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Circuito info */}
                                                                    {visit.pdv.route && (
                                                                        <div className="text-xs text-gray-500 border-t pt-2">
                                                                            📍 {visit.pdv.route.name} • {visit.pdv.route.circuit?.name}
                                                                            {visit.pdv.route.circuit?.zonal?.business && (
                                                                                <span> • {visit.pdv.route.circuit.zonal.business.name}</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        {pdvVisits.length === 0 && (
                                                            <div className="text-center py-6 text-gray-500">
                                                                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                                <p className="text-sm font-medium">No hay visitas registradas</p>
                                                                <p className="text-xs">Para la fecha {currentDate}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
