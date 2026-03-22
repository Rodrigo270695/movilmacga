import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ChevronDown, Download, Search, X, Filter, Save } from 'lucide-react';

function idStr(v: string | number | undefined | null): string {
    return v !== undefined && v !== null && v !== '' ? String(v) : '';
}

function serializeSelections(s: Record<number, string[]>): string {
    const keys = Object.keys(s)
        .map(Number)
        .sort((a, b) => a - b);
    return keys.map((id) => `${id}:${[...(s[id] ?? [])].sort().join(',')}`).join('|');
}

type OperatorModeFlags = { prepago: boolean; pospago: boolean };

function serializeOperatorModes(
    m: Record<number, Record<number, OperatorModeFlags>>
): string {
    const pdvIds = Object.keys(m)
        .map(Number)
        .sort((a, b) => a - b);
    return pdvIds
        .map((pdvId) => {
            const opIds = Object.keys(m[pdvId] ?? {})
                .map(Number)
                .sort((a, b) => a - b);
            const part = opIds
                .map((oid) => {
                    const f = m[pdvId][oid];
                    return `${oid}:${f.prepago ? '1' : '0'}${f.pospago ? '1' : '0'}`;
                })
                .join(',');
            return `${pdvId}|${part}`;
        })
        .join(';');
}

function serializeFullState(
    sel: Record<number, string[]>,
    modes: Record<number, Record<number, OperatorModeFlags>>
): string {
    return `${serializeSelections(sel)}||${serializeOperatorModes(modes)}`;
}

interface OperatorLite {
    id: number;
    name: string;
    color?: string | null;
}

interface PdvRow {
    id: number;
    point_name: string;
    client_name: string;
    classification: string;
    status: string;
    route?: {
        id: number;
        name: string;
        code: string;
        circuit?: {
            id: number;
            name: string;
            code: string;
            zonal?: { id: number; name: string };
        };
    };
    /** Valores de enum pdv_business_types ya guardados */
    business_types?: string[];
    /** Operadores activos por modalidad (pdv_business_type_operators) */
    prepago_operators?: OperatorLite[];
    pospago_operators?: OperatorLite[];
}

interface BusinessTypeOption {
    value: string;
    label: string;
}

function operatorDotColor(color?: string | null): string {
    return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#6366f1';
}

function OperatorPrepPosCell({
    operator,
    flags,
    canEdit,
    onPrepagoChange,
    onPospagoChange,
}: {
    operator: OperatorLite;
    flags: OperatorModeFlags;
    canEdit: boolean;
    onPrepagoChange: (v: boolean) => void;
    onPospagoChange: (v: boolean) => void;
}) {
    const opColor = operatorDotColor(operator.color);
    const checkClass =
        'h-4 w-4 shrink-0 cursor-pointer rounded-sm border-gray-300 data-[state=checked]:border-[var(--operator-color)] data-[state=checked]:bg-[var(--operator-color)] data-[state=checked]:text-primary-foreground';
    return (
        <div
            className="flex min-w-[52px] flex-col items-center justify-center gap-1 py-0.5"
            style={{ ['--operator-color']: opColor } as CSSProperties}
        >
            <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-medium uppercase leading-none text-gray-500">Prep.</span>
                <Checkbox
                    checked={flags.prepago}
                    onCheckedChange={(c) => onPrepagoChange(c === true)}
                    disabled={!canEdit}
                    className={checkClass}
                />
            </div>
            <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-medium uppercase leading-none text-gray-500">Posp.</span>
                <Checkbox
                    checked={flags.pospago}
                    onCheckedChange={(c) => onPospagoChange(c === true)}
                    disabled={!canEdit}
                    className={checkClass}
                />
            </div>
        </div>
    );
}

function formatBusinessTypesSummary(selected: string[], options: BusinessTypeOption[]): string | null {
    if (selected.length === 0) return null;
    const labels = selected.map((v) => options.find((o) => o.value === v)?.label ?? v);
    if (labels.length <= 2) return labels.join(', ');
    return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

function BusinessTypesMultiSelect({
    options,
    value,
    onChange,
    className,
}: {
    options: BusinessTypeOption[];
    value: string[];
    onChange: (next: string[]) => void;
    className?: string;
}) {
    const summary = useMemo(() => formatBusinessTypesSummary(value, options), [value, options]);

    const toggle = useCallback(
        (typeValue: string, checked: boolean) => {
            const set = new Set(value);
            if (checked) set.add(typeValue);
            else set.delete(typeValue);
            onChange(Array.from(set));
        },
        [value, onChange]
    );

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex h-10 w-full min-w-[200px] max-w-md items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:min-w-0 [&>span]:text-left',
                        className
                    )}
                >
                    <span className={cn('truncate', !summary && 'text-muted-foreground')}>
                        {summary ?? 'Seleccionar tipos…'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px] max-w-md max-h-64 overflow-y-auto">
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={value.includes(opt.value)}
                        onCheckedChange={(c) => toggle(opt.value, c === true)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface Business {
    id: number;
    name: string;
}

interface Zonal {
    id: number;
    name: string;
    business_id?: number;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
}

interface RouteOpt {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
}

interface Props {
    pdvs: {
        data: PdvRow[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    businesses: Business[];
    allZonales: Zonal[];
    allCircuits: Circuit[];
    allRoutes: RouteOpt[];
    isVendor: boolean;
    /** Fecha "hoy" en Perú (America/Lima), formato dd/mmm/aaaa para el aviso a vendedores */
    visitDateTodayFormatted: string;
    businessTypeOptions: BusinessTypeOption[];
    /** Si en la página actual ya hay al menos un PDV con filas en pdv_business_types */
    pageHasSavedBusinessTypes: boolean;
    /** Operadores activos (misma lista que PDV - Operadores) */
    operators: OperatorLite[];
    filters: {
        search?: string;
        business_id?: string;
        zonal_id?: string;
        circuit_id?: string;
        route_id?: string;
    };
    flash?: { success?: string; error?: string };
}

export default function NegocioOperadorGlobalIndex({
    pdvs,
    businesses,
    allZonales,
    allCircuits,
    allRoutes,
    isVendor,
    visitDateTodayFormatted,
    businessTypeOptions,
    pageHasSavedBusinessTypes,
    operators,
    filters,
    flash,
}: Props) {
    const { addToast } = useToast();
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = auth?.user?.permissions || [];

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBusiness, setSelectedBusiness] = useState(idStr(filters.business_id));
    const [selectedZonal, setSelectedZonal] = useState(idStr(filters.zonal_id));
    const [selectedCircuit, setSelectedCircuit] = useState(idStr(filters.circuit_id));
    const [selectedRoute, setSelectedRoute] = useState(idStr(filters.route_id));
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selections, setSelections] = useState<Record<number, string[]>>({});
    const [operatorModes, setOperatorModes] = useState<
        Record<number, Record<number, OperatorModeFlags>>
    >({});
    const [initialSnapshot, setInitialSnapshot] = useState('');

    useEffect(() => {
        const nextSel: Record<number, string[]> = {};
        const nextModes: Record<number, Record<number, OperatorModeFlags>> = {};
        pdvs.data.forEach((p) => {
            nextSel[p.id] = [...(p.business_types ?? [])];
            const prep = new Set((p.prepago_operators ?? []).map((o) => o.id));
            const pos = new Set((p.pospago_operators ?? []).map((o) => o.id));
            nextModes[p.id] = {};
            (operators ?? []).forEach((op) => {
                nextModes[p.id][op.id] = {
                    prepago: prep.has(op.id),
                    pospago: pos.has(op.id),
                };
            });
        });
        setSelections(nextSel);
        setOperatorModes(nextModes);
        setInitialSnapshot(serializeFullState(nextSel, nextModes));
    }, [pdvs.data, operators]);

    const hasChanges = useMemo(
        () => serializeFullState(selections, operatorModes) !== initialSnapshot,
        [selections, operatorModes, initialSnapshot]
    );

    const setPdvBusinessTypes = useCallback((pdvId: number, next: string[]) => {
        setSelections((prev) => ({ ...prev, [pdvId]: next }));
    }, []);

    const setOperatorMode = useCallback(
        (pdvId: number, operatorId: number, field: keyof OperatorModeFlags, value: boolean) => {
            setOperatorModes((prev) => {
                const cur = prev[pdvId]?.[operatorId] ?? { prepago: false, pospago: false };
                return {
                    ...prev,
                    [pdvId]: {
                        ...prev[pdvId],
                        [operatorId]: { ...cur, [field]: value },
                    },
                };
            });
        },
        []
    );

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'DCS', href: '#' },
            { title: 'Negocio - Operador', href: '/dcs/negocio-operador' },
        ],
        []
    );

    const hasPermission = (p: string) => userPermissions.includes(p);
    const canUsePage = hasPermission('gestor-negocio-operador-ver');

    const filteredZonales = useMemo(() => {
        if (isVendor) {
            return Array.isArray(allZonales) ? allZonales : [];
        }
        return selectedBusiness && Array.isArray(allZonales)
            ? allZonales.filter((z) => z.business_id?.toString() === selectedBusiness)
            : Array.isArray(allZonales)
              ? allZonales
              : [];
    }, [isVendor, selectedBusiness, allZonales]);

    const filteredCircuits = useMemo(() => {
        if (!selectedZonal) return Array.isArray(allCircuits) ? allCircuits : [];
        return Array.isArray(allCircuits)
            ? allCircuits.filter((c) => c.zonal_id?.toString() === selectedZonal)
            : [];
    }, [selectedZonal, allCircuits]);

    const filteredRoutes = useMemo(() => {
        if (!selectedCircuit) return Array.isArray(allRoutes) ? allRoutes : [];
        return Array.isArray(allRoutes)
            ? allRoutes.filter((r) => r.circuit_id?.toString() === selectedCircuit)
            : [];
    }, [selectedCircuit, allRoutes]);

    useEffect(() => {
        if (flash?.success) addToast({ type: 'success', title: 'Éxito', message: flash.success, duration: 4000 });
        if (flash?.error) addToast({ type: 'error', title: 'Error', message: flash.error, duration: 5000 });
    }, [flash?.success, flash?.error, addToast]);

    // Mantener selects alineados con la respuesta del servidor (p. ej. filtros por defecto para vendedores)
    useEffect(() => {
        setSearchQuery(filters.search || '');
        setSelectedBusiness(idStr(filters.business_id));
        setSelectedZonal(idStr(filters.zonal_id));
        setSelectedCircuit(idStr(filters.circuit_id));
        setSelectedRoute(idStr(filters.route_id));
    }, [filters.search, filters.business_id, filters.zonal_id, filters.circuit_id, filters.route_id]);

    useEffect(() => {
        if (searchDebounce) clearTimeout(searchDebounce);
        const t = setTimeout(
            () =>
                router.get(route('dcs.negocio-operador.index'), {
                    search: searchQuery || undefined,
                    business_id: isVendor ? undefined : selectedBusiness || undefined,
                    zonal_id: selectedZonal || undefined,
                    circuit_id: selectedCircuit || undefined,
                    route_id: selectedRoute || undefined,
                    page: 1,
                }, { preserveState: true, preserveScroll: true, replace: true }),
            500
        );
        setSearchDebounce(t);
        return () => clearTimeout(t);
    }, [searchQuery, selectedBusiness, selectedZonal, selectedCircuit, selectedRoute, isVendor]);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const handleBusinessFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedBusiness(val);
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: val || undefined,
            zonal_id: undefined,
            circuit_id: undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleZonalFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedZonal(val);
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: val || undefined,
            circuit_id: undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCircuitFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedCircuit(val);
        setSelectedRoute('');
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: val || undefined,
            route_id: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleRouteFilter = (v: string) => {
        const val = v === 'all' ? '' : v;
        setSelectedRoute(val);
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: val || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (page: number) => {
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            page: page.toString(),
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('dcs.negocio-operador.index'), {
            search: searchQuery || undefined,
            business_id: isVendor ? undefined : selectedBusiness || undefined,
            zonal_id: selectedZonal || undefined,
            circuit_id: selectedCircuit || undefined,
            route_id: selectedRoute || undefined,
            per_page: perPage.toString(),
            page: '1',
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedBusiness('');
        setSelectedZonal('');
        setSelectedCircuit('');
        setSelectedRoute('');
        router.get(route('dcs.negocio-operador.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleExportToExcel = () => {
        if (!canUsePage) {
            addToast({ type: 'error', title: 'Sin permisos', message: 'No tienes permisos para exportar.', duration: 4000 });
            return;
        }
        const params = new URLSearchParams();
        if (searchQuery?.trim()) params.set('search', searchQuery);
        if (!isVendor && selectedBusiness?.trim()) params.set('business_id', selectedBusiness);
        if (selectedZonal?.trim()) params.set('zonal_id', selectedZonal);
        if (selectedCircuit?.trim()) params.set('circuit_id', selectedCircuit);
        if (selectedRoute?.trim()) params.set('route_id', selectedRoute);
        const url = `${route('dcs.negocio-operador.export')}?${params.toString()}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast({ type: 'success', title: 'Exportación', message: 'Descargando Excel…', duration: 4000 });
    };

    const handleSave = () => {
        if (!canUsePage || !hasChanges || pdvs.data.length === 0) return;
        setSaving(true);
        const selectionsPayload: Record<string, string[]> = {};
        const operatorModesPayload: Record<
            string,
            Record<string, { prepago: boolean; pospago: boolean }>
        > = {};
        pdvs.data.forEach((p) => {
            selectionsPayload[String(p.id)] = [...(selections[p.id] ?? [])];
            const modes = operatorModes[p.id] ?? {};
            const inner: Record<string, { prepago: boolean; pospago: boolean }> = {};
            Object.entries(modes).forEach(([opId, flags]) => {
                inner[opId] = { prepago: flags.prepago, pospago: flags.pospago };
            });
            operatorModesPayload[String(p.id)] = inner;
        });
        router.post(
            route('dcs.negocio-operador.sync'),
            { selections: selectionsPayload, operator_modes: operatorModesPayload },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            }
        );
    };

    const saveDisabled = !canUsePage || saving || !hasChanges || pdvs.data.length === 0;
    const saveLabel = pageHasSavedBusinessTypes ? 'Actualizar' : 'Guardar';
    const savingLabel = pageHasSavedBusinessTypes ? 'Actualizando...' : 'Guardando...';

    const hasActiveFilters = !!(
        (!isVendor && selectedBusiness) ||
        selectedZonal ||
        selectedCircuit ||
        selectedRoute ||
        searchQuery
    );

    const zonalDisabled = !isVendor && !selectedBusiness;
    const circuitDisabled = !selectedZonal;
    const routeDisabled = !selectedCircuit;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Negocio - Operador" />

            <div className="min-h-screen bg-gray-50/30 p-3 sm:p-6 relative">
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        Negocio - Operador
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Configuración por tipo de negocio y operadores (prepago/pospago). Los filtros respetan tu alcance de negocio y zonal.
                                        {isVendor && (
                                            <span className="block mt-1 text-amber-700">
                                                Vendedor: solo rutas con visita programada para hoy ({visitDateTodayFormatted}) en tus circuitos asignados.
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <span>{pdvs.total} PDVs</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    <Button
                                        onClick={handleExportToExcel}
                                        variant="outline"
                                        className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 px-4 py-2 text-sm font-medium cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar Excel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saveDisabled}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {savingLabel}
                                            </span>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {saveLabel}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filtros</span>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre de punto, cliente, documento..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    {searchQuery && (
                                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                    {!isVendor && (
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-medium text-gray-600">Negocio</span>
                                            <Select value={selectedBusiness || 'all'} onValueChange={(v) => handleBusinessFilter(v === 'all' ? '' : v)}>
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue placeholder="Todos los negocios" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los negocios</SelectItem>
                                                    {Array.isArray(businesses) && businesses.map((b) => (
                                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Zonal</span>
                                        <Select value={selectedZonal || 'all'} onValueChange={(v) => handleZonalFilter(v === 'all' ? '' : v)} disabled={zonalDisabled}>
                                            <SelectTrigger className="w-full h-10">
                                                <SelectValue placeholder={isVendor || selectedBusiness ? 'Todos los zonales' : 'Selecciona negocio'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{isVendor || selectedBusiness ? 'Todos los zonales' : 'Selecciona negocio'}</SelectItem>
                                                {filteredZonales.map((z) => (
                                                    <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Circuito</span>
                                        <Select value={selectedCircuit || 'all'} onValueChange={(v) => handleCircuitFilter(v === 'all' ? '' : v)} disabled={circuitDisabled}>
                                            <SelectTrigger className="w-full h-10">
                                                <SelectValue placeholder={selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{selectedZonal ? 'Todos los circuitos' : 'Selecciona zonal'}</SelectItem>
                                                {filteredCircuits.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name} - {c.code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-gray-600">Ruta</span>
                                        <Select value={selectedRoute || 'all'} onValueChange={(v) => handleRouteFilter(v === 'all' ? '' : v)} disabled={routeDisabled}>
                                            <SelectTrigger className="w-full h-10">
                                                <SelectValue placeholder={selectedCircuit ? 'Todas las rutas' : 'Selecciona circuito primero'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{selectedCircuit ? 'Todas las rutas' : 'Selecciona circuito primero'}</SelectItem>
                                                {filteredRoutes.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>{r.name} - {r.code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {hasActiveFilters && (
                                        <div className="flex items-end">
                                            <Button variant="outline" onClick={clearFilters} className="w-full h-10" title="Limpiar filtros">
                                                <X className="w-4 h-4 mr-2" />
                                                Limpiar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {hasActiveFilters && (
                                    <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                                        <span className="text-xs text-gray-500">Filtros activos:</span>
                                        {!isVendor && selectedBusiness && <Badge variant="outline" className="text-xs">Negocio</Badge>}
                                        {selectedZonal && <Badge variant="outline" className="text-xs">Zonal</Badge>}
                                        {selectedCircuit && <Badge variant="outline" className="text-xs">Circuito</Badge>}
                                        {selectedRoute && <Badge variant="outline" className="text-xs">Ruta</Badge>}
                                        {searchQuery && <Badge variant="outline" className="text-xs">Búsqueda</Badge>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {!isMobile && (
                        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                    <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                                PDV / Cliente
                                            </TableHead>
                                            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[320px]">
                                                Tipos de negocio
                                            </TableHead>
                                            {(operators ?? []).map((op) => (
                                                <TableHead
                                                    key={op.id}
                                                    className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap px-2"
                                                >
                                                    {op.name}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pdvs.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={2 + (operators ?? []).length}
                                                    className="text-center text-sm text-gray-500 py-10"
                                                >
                                                    No hay PDVs con los filtros indicados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pdvs.data.map((pdv) => (
                                                <TableRow key={pdv.id} className="hover:bg-gray-50/80">
                                                    <TableCell className="text-sm text-gray-900 align-top">
                                                        <div className="font-medium">{pdv.point_name}</div>
                                                        <div className="text-gray-600 mt-0.5">{pdv.client_name}</div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-3">
                                                        <BusinessTypesMultiSelect
                                                            options={businessTypeOptions}
                                                            value={selections[pdv.id] ?? []}
                                                            onChange={(next) => setPdvBusinessTypes(pdv.id, next)}
                                                        />
                                                    </TableCell>
                                                    {(operators ?? []).map((op) => {
                                                        const flags = operatorModes[pdv.id]?.[op.id] ?? {
                                                            prepago: false,
                                                            pospago: false,
                                                        };
                                                        return (
                                                            <TableCell key={op.id} className="align-top py-2 px-1">
                                                                <OperatorPrepPosCell
                                                                    operator={op}
                                                                    flags={flags}
                                                                    canEdit={canUsePage}
                                                                    onPrepagoChange={(v) =>
                                                                        setOperatorMode(pdv.id, op.id, 'prepago', v)
                                                                    }
                                                                    onPospagoChange={(v) =>
                                                                        setOperatorMode(pdv.id, op.id, 'pospago', v)
                                                                    }
                                                                />
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}

                    {isMobile && (
                        <div className="space-y-3">
                            {pdvs.data.length === 0 ? (
                                <Card className="p-6 text-center text-sm text-gray-500">No hay PDVs.</Card>
                            ) : (
                                pdvs.data.map((pdv) => (
                                    <Card key={pdv.id} className="p-4 border border-gray-200">
                                        <p className="font-medium text-gray-900">{pdv.point_name}</p>
                                        <p className="text-sm text-gray-600 mt-1">{pdv.client_name}</p>
                                        <p className="text-xs font-medium text-gray-500 mt-3 mb-1.5">Tipos de negocio</p>
                                        <BusinessTypesMultiSelect
                                            options={businessTypeOptions}
                                            value={selections[pdv.id] ?? []}
                                            onChange={(next) => setPdvBusinessTypes(pdv.id, next)}
                                            className="max-w-full"
                                        />
                                        <p className="mt-3 text-xs font-medium text-gray-500">Operadores (prepago / pospago)</p>
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            {(operators ?? []).map((op) => {
                                                const flags = operatorModes[pdv.id]?.[op.id] ?? {
                                                    prepago: false,
                                                    pospago: false,
                                                };
                                                return (
                                                    <div
                                                        key={op.id}
                                                        className="flex min-w-[140px] flex-1 flex-col rounded-md border border-gray-200 bg-gray-50/80 p-2"
                                                    >
                                                        <p className="mb-2 text-center text-xs font-semibold text-gray-800">
                                                            {op.name}
                                                        </p>
                                                        <OperatorPrepPosCell
                                                            operator={op}
                                                            flags={flags}
                                                            canEdit={canUsePage}
                                                            onPrepagoChange={(v) =>
                                                                setOperatorMode(pdv.id, op.id, 'prepago', v)
                                                            }
                                                            onPospagoChange={(v) =>
                                                                setOperatorMode(pdv.id, op.id, 'pospago', v)
                                                            }
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {pdvs.last_page > 1 && (
                        <Pagination data={pdvs} onPageChange={handlePageChange} onPerPageChange={handlePerPageChange} />
                    )}

                    <div className="fixed bottom-6 right-6 z-50 sm:hidden flex flex-col gap-3">
                        <Button
                            onClick={handleExportToExcel}
                            size="lg"
                            className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg cursor-pointer"
                            title="Exportar Excel"
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saveDisabled}
                            size="lg"
                            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50 cursor-pointer"
                            title={saveLabel}
                        >
                            <Save className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
