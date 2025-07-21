import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, ArrowRight, Satellite, MapPin, User, Lock } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        username: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="MonitorMacga - Acceso al Sistema" />
            
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
                    
                    {/* Formas geométricas sutiles */}
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-blue-400/10 rounded-full"></div>
                    <div className="absolute bottom-1/3 left-1/4 w-20 h-20 border border-cyan-400/10 rounded-lg rotate-45"></div>
                </div>

                {/* Contenido principal */}
                <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                    
                    {/* Satélite flotando en arco por encima del login */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div className="relative w-full h-full">
                            {/* Satélite con movimiento de arco */}
                            <div className={`absolute top-32 left-1/2 transform -translate-x-1/2 animate-arc-float transition-all duration-2000 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                {/* Satélite que siempre se mantiene derecho */}
                                <div className="relative">
                                    <img 
                                        src="/logo.png" 
                                        alt="Macga Satellite" 
                                        className="w-16 h-16 object-contain drop-shadow-2xl"
                                    />
                                    
                                    {/* Luz parpadeante del satélite */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                    
                                    {/* Estela del satélite */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-400/10 rounded-full animate-ping"></div>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-blue-400/5 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            
                            {/* Arco de trayectoria sutil */}
                            <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
                                <div className="w-80 h-40 border-t border-l border-r border-cyan-400/10 rounded-t-full animate-pulse opacity-30"></div>
                            </div>
                        </div>
                    </div>

                    <div className={`w-full max-w-md transition-all duration-1000 ease-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                        
                        {/* Header del sistema */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
                                Monitor<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text">Macga</span>
                            </h1>
                            
                            <div className="flex items-center justify-center gap-2 text-blue-200 mb-2">
                                <Satellite className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">Sistema de Monitoreo Avanzado</span>
                            </div>
                            
                            <div className="flex items-center justify-center gap-1 text-cyan-300">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs">Geolocalización en Tiempo Real</span>
                            </div>
                        </div>

                        {/* Formulario sin card - directo */}
                        <div className="relative">
                            
                            {/* Status message */}
                            {status && (
                                <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-2xl backdrop-blur-sm">
                                    <p className="text-green-200 text-sm font-medium text-center">{status}</p>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">
                                
                                {/* Campo Usuario */}
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-white/80 font-medium text-xs uppercase tracking-wide flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-blue-300" />
                                        Usuario
                                    </Label>
                                    <div className="relative group">
                                        {/* Contenedor con gradiente animado */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-cyan-400/15 to-blue-500/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-400 blur-sm"></div>
                                        
                                        {/* Borde gradiente */}
                                        <div className="relative bg-gradient-to-r from-blue-500/25 via-cyan-400/25 to-blue-500/25 p-[1px] rounded-xl group-focus-within:from-blue-400/40 group-focus-within:via-cyan-300/40 group-focus-within:to-blue-400/40 transition-all duration-300">
                                            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl">
                                                <div className="flex items-center px-4 py-3">
                                                    <User className="w-4 h-4 text-blue-300/70 group-focus-within:text-cyan-300 transition-colors duration-300 mr-3" />
                                                    <input
                                                        id="username"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="username"
                                                        value={data.username}
                                                        onChange={(e) => setData('username', e.target.value)}
                                                        placeholder="Ingrese su usuario"
                                                        className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 text-base font-normal outline-none focus:outline-none focus:ring-0 focus:border-none"
                                                        style={{
                                                            WebkitTextFillColor: '#ffffff',
                                                            WebkitBackgroundClip: 'text',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Efecto de brillo en focus */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-focus-within:opacity-100 transition-all duration-400 rounded-xl pointer-events-none"></div>
                                    </div>
                                    <InputError message={errors.username} />
                        </div>

                                {/* Campo Contraseña */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-white/80 font-medium text-xs uppercase tracking-wide flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-blue-300" />
                                        Contraseña
                                    </Label>
                                    <div className="relative group">
                                        {/* Contenedor con gradiente animado */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-cyan-400/15 to-blue-500/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-400 blur-sm"></div>
                                        
                                        {/* Borde gradiente */}
                                        <div className="relative bg-gradient-to-r from-blue-500/25 via-cyan-400/25 to-blue-500/25 p-[1px] rounded-xl group-focus-within:from-blue-400/40 group-focus-within:via-cyan-300/40 group-focus-within:to-blue-400/40 transition-all duration-300">
                                            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl">
                                                <div className="flex items-center px-4 py-3">
                                                    <Lock className="w-4 h-4 text-blue-300/70 group-focus-within:text-cyan-300 transition-colors duration-300 mr-3" />
                                                    <input
                            id="password"
                                                        type={showPassword ? 'text' : 'password'}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                                                        placeholder="Ingrese su contraseña"
                                                        className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 text-base font-normal outline-none focus:outline-none focus:ring-0 focus:border-none"
                                                        style={{
                                                            WebkitTextFillColor: '#ffffff',
                                                            WebkitBackgroundClip: 'text',
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="ml-2 text-white/50 hover:text-cyan-300 transition-colors duration-200"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Efecto de brillo en focus */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-focus-within:opacity-100 transition-all duration-400 rounded-xl pointer-events-none"></div>
                                    </div>
                        <InputError message={errors.password} />
                    </div>

                                {/* Opciones */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                                            className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 w-4 h-4"
                                        />
                                        <Label htmlFor="remember" className="text-white/70 text-sm font-normal">
                                            Recordar sesión
                                        </Label>
                                    </div>

                    </div>

                                {/* Botón Principal */}
                                <div className="pt-3">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        tabIndex={4}
                                        className="group w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 border-0 cursor-pointer"
                                    >
                                        {processing ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <LoaderCircle className="w-6 h-6 animate-spin" />
                                                <span>Verificando acceso...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3">
                                                <span>Acceder al Sistema</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                            </div>
                                        )}
                    </Button>
                </div>

                            </form>
                        </div>

                        {/* Footer minimalista */}
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

            {/* Estilos para autocompletado y animaciones */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    input:-webkit-autofill,
                    input:-webkit-autofill:hover,
                    input:-webkit-autofill:focus,
                    input:-webkit-autofill:active {
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: #ffffff !important;
                        transition: background-color 5000s ease-in-out 0s;
                        box-shadow: inset 0 0 20px 20px transparent !important;
                    }

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
