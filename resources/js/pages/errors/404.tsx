import { Head, Link } from '@inertiajs/react';
import { Home, ArrowLeft, AlertCircle, Satellite } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { route } from 'ziggy-js';

export default function NotFound() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <>
            <Head title="404 - Página no encontrada | MonitorMacga" />
            
            {/* Container principal con gradiente dinámico */}
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0">
                    {/* Gradiente animado */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-cyan-400/20 animate-pulse"></div>
                    
                    {/* Puntos flotantes */}
                    <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="absolute top-40 right-32 w-1 h-1 bg-cyan-300 rounded-full animate-ping"></div>
                    <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                    <div className="absolute top-60 right-60 w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
                    
                    {/* Formas geométricas sutiles */}
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-blue-400/10 rounded-full"></div>
                    <div className="absolute bottom-1/3 left-1/4 w-20 h-20 border border-cyan-400/10 rounded-lg rotate-45"></div>
                    <div className="absolute top-1/2 right-1/3 w-24 h-24 border border-red-400/10 rounded-full"></div>
                </div>

                {/* Contenido principal */}
                <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                    
                    {/* Satélite flotando */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div className="relative w-full h-full">
                            <div className={`absolute top-32 left-1/2 transform -translate-x-1/2 animate-arc-float transition-all duration-2000 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                <div className="relative">
                                    <img 
                                        src="/logo.png" 
                                        alt="Macga Satellite" 
                                        className="w-16 h-16 object-contain drop-shadow-2xl"
                                    />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-400/10 rounded-full animate-ping"></div>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-red-400/5 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`w-full max-w-2xl transition-all duration-1000 ease-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                        
                        {/* Header del sistema */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
                                Monitor<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text">Macga</span>
                            </h1>
                            
                            <div className="flex items-center justify-center gap-2 text-blue-200 mb-2">
                                <Satellite className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">Sistema de Monitoreo Avanzado</span>
                            </div>
                        </div>

                        {/* Contenido del error */}
                        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-blue-500/25 p-8 sm:p-12 shadow-2xl">
                            
                            {/* Icono de error */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-400/30 rounded-full p-6">
                                        <AlertCircle className="w-16 h-16 text-red-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Número 404 */}
                            <div className="text-center mb-6">
                                <h2 className="text-8xl sm:text-9xl font-black text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text mb-4">
                                    404
                                </h2>
                                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-cyan-400 mx-auto rounded-full"></div>
                            </div>

                            {/* Mensaje */}
                            <div className="text-center mb-8">
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                    Página no encontrada
                                </h3>
                                <p className="text-blue-200/80 text-base sm:text-lg">
                                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                                </p>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    asChild
                                    className="group h-12 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300"
                                >
                                    <Link href={route('dashboard')}>
                                        <Home className="w-4 h-4 mr-2" />
                                        Ir al Dashboard
                                    </Link>
                                </Button>
                                
                                <Button
                                    asChild
                                    variant="outline"
                                    className="group h-12 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:text-cyan-300 font-semibold text-base rounded-xl transition-all duration-300"
                                    onClick={() => window.history.back()}
                                >
                                    <button type="button">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver atrás
                                    </button>
                                </Button>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="text-center mt-8 space-y-2">
                            <p className="text-white/60 text-sm">
                                Plataforma Segura de Monitoreo
                            </p>
                            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                                <span>©</span>
                                <span>{new Date().getFullYear()} Macga</span>
                                <span>•</span>
                                <span>Todos los derechos reservados</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Estilos para animaciones */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes arc-float {
                        0% { 
                            transform: translateX(200px) translateY(60px) scale(0.8);
                        }
                        25% { 
                            transform: translateX(100px) translateY(-20px) scale(0.9);
                        }
                        50% { 
                            transform: translateX(0px) translateY(-40px) scale(1);
                        }
                        75% { 
                            transform: translateX(-100px) translateY(-20px) scale(0.9);
                        }
                        100% { 
                            transform: translateX(-200px) translateY(60px) scale(0.8);
                        }
                    }

                    .animate-arc-float {
                        animation: arc-float 12s ease-in-out infinite alternate;
                    }
                `
            }} />
        </>
    );
}

