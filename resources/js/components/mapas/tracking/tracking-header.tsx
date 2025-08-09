import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, X } from 'lucide-react';
import type { Stats } from '@/types/tracking';

interface TrackingHeaderProps {
    stats: Stats;
    isAutoRefresh: boolean;
    showFilters: boolean;
    lastUpdate: Date | null;
    onToggleAutoRefresh: () => void;
    onToggleFilters: () => void;
}

export default function TrackingHeader({
    stats,
    isAutoRefresh,
    showFilters,
    lastUpdate,
    onToggleAutoRefresh,
    onToggleFilters
}: TrackingHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sistema de Rastreo Avanzado</h1>
                        <p className="text-gray-600 mt-1">Monitoreo en tiempo real de vendedores</p>
                    </div>

                    {/* Estadísticas compactas */}
                    <div className="hidden lg:flex items-center gap-4 ml-8">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Vendedores:</span>
                            <Badge variant="secondary" className="text-sm">{stats.total_users}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">En línea:</span>
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">{stats.online_users}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Sesiones:</span>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm">{stats.active_sessions}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Circuitos:</span>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-sm">{stats.total_circuits}</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={isAutoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={onToggleAutoRefresh}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
                        Auto-refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFilters}
                        className="flex items-center gap-2"
                    >
                        {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        Filtros
                    </Button>

                    {lastUpdate && (
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span>
                                Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas móviles (solo en pantallas pequeñas) */}
            <div className="lg:hidden flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">Vendedores: {stats.total_users}</Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">En línea: {stats.online_users}</Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Sesiones: {stats.active_sessions}</Badge>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">Circuitos: {stats.total_circuits}</Badge>
            </div>
        </div>
    );
}
