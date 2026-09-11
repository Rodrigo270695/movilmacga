import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Filtros {
    year?: string;
    month?: string;
    business_id?: string;
    zonal_id?: string;
    circuit_id?: string;
    route_id?: string;
    pdv_status?: string;
    per_page?: string;
}

interface Opciones {
    businesses: Array<{ id: number; name: string }>;
    zonales: Array<{ id: number; name: string; business_id: number }>;
    circuits: Array<{ id: number; name: string; code: string; zonal_id: number }>;
    routes: Array<{ id: number; name: string; code: string; circuit_id: number }>;
    months: Array<{ value: string; label: string }>;
    years: Array<{ value: string; label: string }>;
}

interface Props {
    filtros: Filtros;
    opciones: Opciones;
}

export function FrecuenciaFilters({ filtros, opciones }: Props) {
    const [local, setLocal] = useState({
        year: filtros.year || '',
        month: filtros.month || '',
        business_id: filtros.business_id || '',
        zonal_id: filtros.zonal_id || '',
        circuit_id: filtros.circuit_id || '',
        route_id: filtros.route_id || '',
        pdv_status: filtros.pdv_status || 'vende',
    });

    const apply = (next: typeof local) => {
        const params: Record<string, string> = {};
        Object.entries(next).forEach(([key, value]) => {
            if (key === 'pdv_status') {
                if (value) params[key] = value;
                return;
            }
            if (value && value !== 'todos') params[key] = value;
        });
        if (filtros.per_page) params.per_page = filtros.per_page;
        router.get('/reportes/frecuencia-visitas-pdv', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const update = (key: keyof typeof local, value: string) => {
        const next = { ...local, [key]: key === 'pdv_status' ? value : (value === 'todos' ? '' : value) };
        if (key === 'business_id') {
            next.zonal_id = '';
            next.circuit_id = '';
            next.route_id = '';
        }
        if (key === 'zonal_id') {
            next.circuit_id = '';
            next.route_id = '';
        }
        if (key === 'circuit_id') {
            next.route_id = '';
        }
        setLocal(next);
        apply(next);
    };

    const clear = () => {
        const next = {
            year: local.year,
            month: local.month,
            business_id: '',
            zonal_id: '',
            circuit_id: '',
            route_id: '',
            pdv_status: 'vende',
        };
        setLocal(next);
        apply(next);
    };

    const hasFilters = Boolean(
        local.business_id || local.zonal_id || local.circuit_id || local.route_id || (local.pdv_status && local.pdv_status !== 'vende')
    );

    return (
        <Card className="p-4 no-print">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
                </div>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clear} className="h-8 text-xs">
                        <X className="w-3 h-3 mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <div>
                    <Label className="text-xs text-gray-600">Mes</Label>
                    <Select value={local.month} onValueChange={(v) => update('month', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Mes" /></SelectTrigger>
                        <SelectContent>
                            {opciones.months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Año</Label>
                    <Select value={local.year} onValueChange={(v) => update('year', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Año" /></SelectTrigger>
                        <SelectContent>
                            {opciones.years.map((y) => (
                                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Negocio</Label>
                    <Select value={local.business_id || 'todos'} onValueChange={(v) => update('business_id', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los negocios</SelectItem>
                            {opciones.businesses.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Zonal</Label>
                    <Select value={local.zonal_id || 'todos'} onValueChange={(v) => update('zonal_id', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todas las zonales</SelectItem>
                            {opciones.zonales.map((z) => (
                                <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Circuito</Label>
                    <Select value={local.circuit_id || 'todos'} onValueChange={(v) => update('circuit_id', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los circuitos</SelectItem>
                            {opciones.circuits.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Ruta</Label>
                    <Select value={local.route_id || 'todos'} onValueChange={(v) => update('route_id', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todas las rutas</SelectItem>
                            {opciones.routes.map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-600">Estado PDV</Label>
                    <Select value={local.pdv_status || 'vende'} onValueChange={(v) => update('pdv_status', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Vende" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vende">Vende</SelectItem>
                            <SelectItem value="no vende">No vende</SelectItem>
                            <SelectItem value="todos">Vende y no vende</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
}
