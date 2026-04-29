import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, ArrowRight, User, Lock, Shield } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import type { SharedData } from '@/types';

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

export default function LoginTreinta({ status, canResetPassword }: LoginProps) {
    const { theme } = usePage<SharedData>().props;
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
            <Head title={`${theme.name} - Acceso al Sistema`} />

            <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>

                {/* ── Fondo geométrico con hexágonos ── */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Hexágonos decorativos - inspirados en el logo */}
                    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="hex-pattern" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
                                <polygon
                                    points="40,2 76,22 76,62 40,82 4,62 4,22"
                                    fill="none"
                                    stroke="#cc2200"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hex-pattern)" />
                    </svg>

                    {/* Gradiente radial rojo en la esquina superior */}
                    <div
                        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #cc2200 0%, transparent 70%)' }}
                    />

                    {/* Gradiente radial gris en la esquina inferior */}
                    <div
                        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-8"
                        style={{ background: 'radial-gradient(circle, #555 0%, transparent 70%)' }}
                    />

                    {/* Líneas de acento */}
                    <div className="absolute top-0 left-1/2 w-px h-full opacity-5" style={{ background: 'linear-gradient(to bottom, transparent, #cc2200, transparent)' }} />
                    <div className="absolute top-1/2 left-0 w-full h-px opacity-5" style={{ background: 'linear-gradient(to right, transparent, #cc2200, transparent)' }} />

                    {/* Hexágono grande decorativo izquierda */}
                    <svg className="absolute -left-24 top-1/2 -translate-y-1/2 w-96 h-96 opacity-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="100,5 185,52.5 185,147.5 100,195 15,147.5 15,52.5" fill="none" stroke="#cc2200" strokeWidth="2" />
                        <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="#888" strokeWidth="1" />
                    </svg>

                    {/* Hexágono grande decorativo derecha */}
                    <svg className="absolute -right-24 top-1/4 w-80 h-80 opacity-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="100,5 185,52.5 185,147.5 100,195 15,147.5 15,52.5" fill="none" stroke="#cc2200" strokeWidth="2" />
                    </svg>
                </div>

                {/* ── Contenido principal ── */}
                <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                    <div className={`w-full max-w-md transition-all duration-700 ease-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>

                        {/* Logo + nombre */}
                        <div className="text-center mb-10">
                            <div className="flex justify-center mb-5">
                                <div className="relative">
                                    {/* Resplandor rojo detrás del logo */}
                                    <div
                                        className="absolute inset-0 rounded-full blur-2xl opacity-40 scale-125"
                                        style={{ background: 'radial-gradient(circle, #cc2200, transparent)' }}
                                    />
                                    <img
                                        src={theme.logo}
                                        alt={theme.name}
                                        className="relative w-24 h-24 object-contain drop-shadow-2xl"
                                    />
                                </div>
                            </div>

                            <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: '#f0f0f0' }}>
                                <span style={{ color: '#cc2200' }}>{theme.name}</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2" style={{ color: '#888' }}>
                                <Shield className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium tracking-wide uppercase">Sistema de Monitoreo</span>
                            </div>
                        </div>

                        {/* ── Card del formulario ── */}
                        <div
                            className="relative rounded-2xl p-8"
                            style={{
                                background: 'linear-gradient(135deg, #141414 0%, #1a1a1a 100%)',
                                border: '1px solid #2a2a2a',
                                boxShadow: '0 0 60px rgba(204,34,0,0.08), 0 24px 48px rgba(0,0,0,0.6)',
                            }}
                        >
                            {/* Línea de acento roja en la parte superior de la card */}
                            <div
                                className="absolute top-0 left-8 right-8 h-px rounded-full"
                                style={{ background: 'linear-gradient(to right, transparent, #cc2200, transparent)' }}
                            />

                            {status && (
                                <div className="mb-6 p-4 rounded-xl text-sm font-medium text-center"
                                    style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.3)', color: '#ff7a6e' }}>
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">

                                {/* Campo Usuario */}
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                                        <User className="w-3 h-3" style={{ color: '#cc2200' }} />
                                        Usuario
                                    </Label>
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus-within:ring-1"
                                        style={{
                                            background: '#0f0f0f',
                                            border: '1px solid #2a2a2a',
                                            // @ts-expect-error CSS custom property
                                            '--tw-ring-color': '#cc2200',
                                        }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = '#cc2200')}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                                    >
                                        <User className="w-4 h-4 shrink-0" style={{ color: '#555' }} />
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
                                            className="flex-1 bg-transparent border-none outline-none text-base"
                                            style={{ color: '#f0f0f0' }}
                                        />
                                    </div>
                                    <InputError message={errors.username} />
                                </div>

                                {/* Campo Contraseña */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                                        <Lock className="w-3 h-3" style={{ color: '#cc2200' }} />
                                        Contraseña
                                    </Label>
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                                        style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = '#cc2200')}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                                    >
                                        <Lock className="w-4 h-4 shrink-0" style={{ color: '#555' }} />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Ingrese su contraseña"
                                            className="flex-1 bg-transparent border-none outline-none text-base"
                                            style={{ color: '#f0f0f0' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            className="transition-colors duration-200"
                                            style={{ color: '#555' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = '#cc2200')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Recordar sesión */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                        tabIndex={3}
                                        className="w-4 h-4 border-[#444] data-[state=checked]:bg-red-700 data-[state=checked]:border-red-700"
                                    />
                                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer" style={{ color: '#666' }}>
                                        Recordar sesión
                                    </Label>
                                </div>

                                {/* Botón */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        tabIndex={4}
                                        className="group w-full h-12 rounded-xl font-bold text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            background: processing
                                                ? '#7a1500'
                                                : 'linear-gradient(135deg, #cc2200 0%, #e63300 100%)',
                                            color: '#fff',
                                            boxShadow: '0 4px 24px rgba(204,34,0,0.35)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!processing) {
                                                e.currentTarget.style.boxShadow = '0 6px 32px rgba(204,34,0,0.55)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 24px rgba(204,34,0,0.35)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="w-5 h-5 animate-spin" />
                                                <span>Verificando acceso...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Acceder al Sistema</span>
                                                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6 space-y-1">
                            <p className="text-xs" style={{ color: '#444' }}>
                                Plataforma Segura de Monitoreo
                            </p>
                            <p className="text-xs" style={{ color: '#333' }}>
                                © {new Date().getFullYear()} {theme.company} · Todos los derechos reservados
                            </p>
                        </div>

                    </div>
                </div>

                {/* Fix autocompletado del browser */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        input:-webkit-autofill,
                        input:-webkit-autofill:hover,
                        input:-webkit-autofill:focus {
                            -webkit-text-fill-color: #f0f0f0 !important;
                            -webkit-box-shadow: 0 0 0px 1000px #0f0f0f inset !important;
                            transition: background-color 5000s ease-in-out 0s;
                        }
                    `
                }} />
            </div>
        </>
    );
}
