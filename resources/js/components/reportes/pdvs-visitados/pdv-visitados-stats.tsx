import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    BarChart3
} from 'lucide-react';

interface Estadisticas {
    total_visitas: number;
    visitas_completadas: number;
    visitas_en_progreso: number;
    visitas_canceladas: number;
    promedio_duracion: number;
    total_vendedores: number;
    total_pdvs: number;
}

interface PdvVisitadosStatsProps {
    estadisticas: Estadisticas;
}

export function PdvVisitadosStats({ estadisticas }: PdvVisitadosStatsProps) {
    const porcentajeCompletadas = estadisticas.total_visitas > 0
        ? Math.round((estadisticas.visitas_completadas / estadisticas.total_visitas) * 100)
        : 0;

    const porcentajeEnProgreso = estadisticas.total_visitas > 0
        ? Math.round((estadisticas.visitas_en_progreso / estadisticas.total_visitas) * 100)
        : 0;

    const porcentajeCanceladas = estadisticas.total_visitas > 0
        ? Math.round((estadisticas.visitas_canceladas / estadisticas.total_visitas) * 100)
        : 0;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total de Visitas */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            Total de Visitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {estadisticas.total_visitas.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Visitas registradas en el período
                        </p>
                    </CardContent>
                </Card>

                {/* Vendedores Activos */}
                <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            Vendedores Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {estadisticas.total_vendedores}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Vendedores con visitas registradas
                        </p>
                    </CardContent>
                </Card>

                {/* PDVs Visitados */}
                <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            PDVs Visitados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {estadisticas.total_pdvs}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Puntos de venta únicos visitados
                        </p>
                    </CardContent>
                </Card>

                {/* Promedio de Duración */}
                <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Duración Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {estadisticas.promedio_duracion ?
                                `${Math.round(estadisticas.promedio_duracion)} min` :
                                'N/A'
                            }
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Tiempo promedio por visita
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Estadísticas de Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* Visitas Completadas */}
            <Card className="border border-green-200 bg-green-50/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {estadisticas.visitas_completadas}
                                </div>
                                <div className="text-sm text-gray-600">Completadas</div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                            {porcentajeCompletadas}%
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Visitas en Progreso */}
            <Card className="border border-yellow-200 bg-yellow-50/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {estadisticas.visitas_en_progreso}
                                </div>
                                <div className="text-sm text-gray-600">En Progreso</div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            {porcentajeEnProgreso}%
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Visitas Canceladas */}
            <Card className="border border-red-200 bg-red-50/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {estadisticas.visitas_canceladas}
                                </div>
                                <div className="text-sm text-gray-600">Canceladas</div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                            {porcentajeCanceladas}%
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    );
}
