import { MapPin, Users, Route, Shield, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function ColorPaletteDemo() {
    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-primary-800 mb-2">
                    Paleta de Colores MonitorMacga
                </h1>
                <p className="text-primary-600">
                    Sistema de colores para monitoreo y geolocalización
                </p>
            </div>

            {/* Estados de Supervisores */}
            <section className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-primary-700 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Estados de Supervisores
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-active rounded-full mx-auto flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-active">Activo</p>
                            <p className="text-xs text-gray-500">En línea</p>
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-moving rounded-full mx-auto flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-moving">Movimiento</p>
                            <p className="text-xs text-gray-500">En ruta</p>
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-stopped rounded-full mx-auto flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-stopped">Detenido</p>
                            <p className="text-xs text-gray-500">Sin movimiento</p>
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-alert rounded-full mx-auto flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-alert">Alerta</p>
                            <p className="text-xs text-gray-500">Problema</p>
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-break rounded-full mx-auto flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-break">Descanso</p>
                            <p className="text-xs text-gray-500">Pausa</p>
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-supervisor-inactive rounded-full mx-auto flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-supervisor-inactive">Offline</p>
                            <p className="text-xs text-gray-500">Desconectado</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Rutas y Trayectorias */}
            <section className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-primary-700 mb-4 flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Estados de Rutas
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border-l-4 border-route-active bg-route-active/10 rounded">
                        <p className="font-medium text-route-active">Ruta Activa</p>
                        <p className="text-sm text-gray-600">En progreso</p>
                    </div>

                    <div className="p-4 border-l-4 border-route-planned bg-route-planned/10 rounded">
                        <p className="font-medium text-route-planned">Ruta Planificada</p>
                        <p className="text-sm text-gray-600">Programada</p>
                    </div>

                    <div className="p-4 border-l-4 border-route-delayed bg-route-delayed/10 rounded">
                        <p className="font-medium text-route-delayed">Ruta Retrasada</p>
                        <p className="text-sm text-gray-600">Con demora</p>
                    </div>

                    <div className="p-4 border-l-4 border-route-completed bg-route-completed/10 rounded">
                        <p className="font-medium text-route-completed">Ruta Completada</p>
                        <p className="text-sm text-gray-600">Finalizada</p>
                    </div>
                </div>
            </section>

            {/* Zonas de Trabajo */}
            <section className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-primary-700 mb-4">
                    Zonas de Trabajo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-zone-safe border border-status-success rounded-lg">
                        <h3 className="font-medium text-status-success mb-2">Zona Segura</h3>
                        <p className="text-sm text-gray-600">Área autorizada para trabajo</p>
                    </div>

                    <div className="p-6 bg-zone-priority border border-status-warning rounded-lg">
                        <h3 className="font-medium text-status-warning mb-2">Zona Prioritaria</h3>
                        <p className="text-sm text-gray-600">Área de alta importancia</p>
                    </div>

                    <div className="p-6 bg-zone-restricted border border-status-error rounded-lg">
                        <h3 className="font-medium text-status-error mb-2">Zona Restringida</h3>
                        <p className="text-sm text-gray-600">Área de acceso limitado</p>
                    </div>
                </div>
            </section>

            {/* Estados del Sistema */}
            <section className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-primary-700 mb-4">
                    Estados del Sistema
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-status-success-bg border border-status-success rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-status-success" />
                            <span className="font-medium text-status-success">Éxito</span>
                        </div>
                        <p className="text-sm text-gray-600">Operación completada</p>
                    </div>

                    <div className="p-4 bg-status-warning-bg border border-status-warning rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-status-warning" />
                            <span className="font-medium text-status-warning">Advertencia</span>
                        </div>
                        <p className="text-sm text-gray-600">Atención requerida</p>
                    </div>

                    <div className="p-4 bg-status-error-bg border border-status-error rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-status-error" />
                            <span className="font-medium text-status-error">Error</span>
                        </div>
                        <p className="text-sm text-gray-600">Problema crítico</p>
                    </div>

                    <div className="p-4 bg-status-info-bg border border-status-info rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-5 h-5 text-status-info" />
                            <span className="font-medium text-status-info">Información</span>
                        </div>
                        <p className="text-sm text-gray-600">Dato informativo</p>
                    </div>
                </div>
            </section>

            {/* Botones de Ejemplo */}
            <section className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-primary-700 mb-4">
                    Botones de Acción
                </h2>
                <div className="flex flex-wrap gap-3">
                    <button className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-colors">
                        Acción Principal
                    </button>
                    <button className="px-6 py-3 bg-status-success hover:bg-status-success/90 text-white rounded-lg font-medium transition-colors">
                        Confirmar
                    </button>
                    <button className="px-6 py-3 bg-status-warning hover:bg-status-warning/90 text-white rounded-lg font-medium transition-colors">
                        Advertir
                    </button>
                    <button className="px-6 py-3 bg-status-error hover:bg-status-error/90 text-white rounded-lg font-medium transition-colors">
                        Cancelar
                    </button>
                    <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                        Neutral
                    </button>
                </div>
            </section>
        </div>
    );
}
