import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Usando componente Select personalizado para evitar bucles infinitos de Radix UI
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomSelect } from '@/components/ui/custom-select';
import { Checkbox } from '@/components/ui/checkbox';
// Usando componente Dialog personalizado para evitar bucles infinitos de Radix UI
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    CustomDialog as Dialog,
    CustomDialogContent as DialogContent,
    CustomDialogDescription as DialogDescription,
    CustomDialogFooter as DialogFooter,
    CustomDialogHeader as DialogHeader,
    CustomDialogTitle as DialogTitle
} from '@/components/ui/custom-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapSelector } from './map-selector';

interface PdvModel {
    id: number;
    point_name: string;
    pos_id?: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    client_name: string;
    phone: string;
    classification: string;
    status: string;
    sells_recharge: boolean;
    address: string;
    reference?: string;
    latitude: number;
    longitude: number;
    route_id: number;
    district_id: number;
    locality: string;
    route?: { name: string; circuit?: { name: string } };
    district?: { name: string; provincia?: { name: string } };
}

interface Zonal {
    id: number;
    name: string;
    business_id: number;
}

interface Circuit {
    id: number;
    name: string;
    code: string;
    zonal_id: number;
}

interface Route {
    id: number;
    name: string;
    code: string;
    circuit_id: number;
}

interface Departamento {
    id: number;
    name: string;
}

interface GeographicItem {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    pdv?: PdvModel | null;
    zonales: Zonal[];
    circuits: Circuit[];
    departamentos: Departamento[];
}

interface FormData {
    point_name: string;
    pos_id: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    client_name: string;
    phone: string;
    classification: string;
    status: string;
    sells_recharge: boolean;
    address: string;
    reference: string;
    latitude: string;
    longitude: string;
    zonal_id: string;
    circuit_id: string;
    route_id: string;
    district_id: string;
    locality: string;
    departamento_id: string;
    provincia_id: string;
    [key: string]: string | boolean;
}

export function PdvForm({
    open,
    onClose,
    pdv,
    zonales,
    circuits,
    departamentos
}: Props) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<FormData>({
        point_name: '',
        pos_id: '',
        document_type: 'DNI',
        document_number: '',
        client_name: '',
        phone: '',
        classification: 'bodega',
        status: 'vende',
        sells_recharge: false,
        address: '',
        reference: '',
        latitude: '',
        longitude: '',
        zonal_id: '',
        circuit_id: '',
        route_id: '',
        district_id: '',
        locality: '',
        departamento_id: '',
        provincia_id: '',
    });

    // Estados para carga dinámica
    const [availableCircuits, setAvailableCircuits] = useState<Circuit[]>([]);
    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
    const [provincias, setProvincias] = useState<GeographicItem[]>([]);
    const [distritos, setDistritos] = useState<GeographicItem[]>([]);
    const [loadingCircuits, setLoadingCircuits] = useState(false);
    const [loadingProvincias, setLoadingProvincias] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Estado para enfoque dinámico del mapa
    const [mapFocusLocation, setMapFocusLocation] = useState<string>('');

    // Estado para detectar si estamos en móvil
    const [isMobile, setIsMobile] = useState(false);

    // Función helper para limpieza completa del formulario
    const clearFormCompletely = () => {
        // Resetear a valores iniciales explícitamente
        setData({
            point_name: '',
            pos_id: '',
            document_type: 'DNI',
            document_number: '',
            client_name: '',
            phone: '',
            classification: 'bodega',
            status: 'vende',
            sells_recharge: false,
            address: '',
            reference: '',
            latitude: '',
            longitude: '',
            zonal_id: '',
            circuit_id: '',
            route_id: '',
            district_id: '',
            locality: '',
            departamento_id: '',
            provincia_id: '',
        });
        setAvailableCircuits([]);
        setAvailableRoutes([]);
        setProvincias([]);
        setDistritos([]);
        setMapFocusLocation('');
        setLoadingCircuits(false);
        setLoadingProvincias(false);
        setLoadingDistritos(false);
        setLoadingRoutes(false);
    };

    // Cargar circuitos cuando cambia el zonal
    const handleZonalChange = async (zonalId: string, keepValues = false) => {
        setData('zonal_id', zonalId);

        if (!keepValues) {
            setData('circuit_id', '');
            setData('route_id', '');
        }

        setAvailableCircuits([]);
        setAvailableRoutes([]);

        if (!zonalId) {
            return;
        }

        setLoadingCircuits(true);
        try {
            const response = await fetch(`/dcs/ajax/circuits?zonal_id=${zonalId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Response is not JSON");
            }

            const circuits = await response.json();
            setAvailableCircuits(Array.isArray(circuits) ? circuits : []);
        } catch (error) {
            console.error('Error cargando circuitos:', error);
            setAvailableCircuits([]);
        } finally {
            setLoadingCircuits(false);
        }
    };

    // Cargar rutas cuando cambia el circuito
    const handleCircuitChange = async (circuitId: string, keepValues = false) => {
        setData('circuit_id', circuitId);

        if (!keepValues) {
            setData('route_id', '');
        }

        setAvailableRoutes([]);

        if (!circuitId) {
            return;
        }

        setLoadingRoutes(true);
        try {
            const response = await fetch(`/dcs/ajax/routes?circuit_id=${circuitId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Response is not JSON");
            }

            const routes = await response.json();
            setAvailableRoutes(Array.isArray(routes) ? routes : []);
        } catch (error) {
            console.error('Error cargando rutas:', error);
            setAvailableRoutes([]);
        } finally {
            setLoadingRoutes(false);
        }
    };

        // Cargar provincias cuando cambia el departamento
    const handleDepartamentoChange = async (departamentoId: string, keepValues = false) => {
        setData('departamento_id', departamentoId);

        if (!keepValues) {
            setData('provincia_id', '');
            setData('district_id', '');
            setData('locality', '');
        }

        setProvincias([]);
        setDistritos([]);

        if (!departamentoId) {
            setMapFocusLocation('');
            return;
        }

        // Enfocar mapa en el departamento seleccionado
        const selectedDepartamento = departamentos.find(d => d.id.toString() === departamentoId);
        if (selectedDepartamento) {
            setMapFocusLocation(`${selectedDepartamento.name} departamento`);
        }

        setLoadingProvincias(true);
        try {
            const response = await fetch(`/dcs/ajax/provincias?departamento_id=${departamentoId}`);
            const provincias = await response.json();
            setProvincias(provincias);
        } catch (error) {
            console.error('Error cargando provincias:', error);
        } finally {
            setLoadingProvincias(false);
        }
    };

        // Cargar distritos cuando cambia la provincia
    const handleProvinciaChange = async (provinciaId: string, keepValues = false) => {
        setData('provincia_id', provinciaId);

        if (!keepValues) {
            setData('district_id', '');
            setData('locality', '');
        }

        setDistritos([]);

        if (!provinciaId) return;

        // Enfocar mapa en la provincia seleccionada
        const selectedProvincia = provincias.find(p => p.id.toString() === provinciaId);
        if (selectedProvincia) {
            setMapFocusLocation(`${selectedProvincia.name} provincia`);
        }

        setLoadingDistritos(true);
        try {
            const response = await fetch(`/dcs/ajax/distritos?provincia_id=${provinciaId}`);
            const distritos = await response.json();
            setDistritos(distritos);
        } catch (error) {
            console.error('Error cargando distritos:', error);
        } finally {
            setLoadingDistritos(false);
        }
    };

        // Actualizar distrito directamente (ya no necesitamos cargar localidades)
    const handleDistritoChange = (distritoId: string) => {
        setData('district_id', distritoId);

        // Enfocar mapa en el distrito seleccionado
        const selectedDistrito = distritos.find(d => d.id.toString() === distritoId);
        if (selectedDistrito) {
            setMapFocusLocation(`${selectedDistrito.name} distrito`);
        }
    };

    // Detectar si estamos en móvil
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    // Efectos para cargar datos del PDV en edición
    useEffect(() => {
        if (open && pdv) {
            // Cargar datos dependientes para edición (incluye setData)
            loadEditingData();
        } else if (open && !pdv) {
            // Limpieza completa para nuevo PDV
            clearFormCompletely();
        }
    }, [open, pdv?.id]); // Solo depender del ID del PDV para evitar bucles

    // Efecto para limpiar cuando se cierra el modal
    useEffect(() => {
        if (!open) {
            // Limpieza completa cuando se cierra el modal
            clearFormCompletely();
        }
    }, [open]);

        // Función para cargar datos cuando se está editando
    const loadEditingData = async () => {
        if (!pdv) return;

        try {
            // Cargar la información completa del PDV para obtener los IDs geográficos
            const response = await fetch(`/dcs/ajax/pdv-details/${pdv.id}`);
            if (response.ok) {
                const pdvDetails = await response.json();

                // Actualizar todos los datos del formulario con la información completa
                setData(prev => ({
                    ...prev,
                    // Datos básicos
                    point_name: pdvDetails.point_name || '',
                    pos_id: pdvDetails.pos_id || '',
                    document_type: pdvDetails.document_type || 'DNI',
                    document_number: pdvDetails.document_number || '',
                    client_name: pdvDetails.client_name || '',
                    phone: pdvDetails.phone || '',
                    classification: pdvDetails.classification || 'bodega',
                    status: pdvDetails.status || 'vende',
                    sells_recharge: pdvDetails.sells_recharge ?? false,
                    address: pdvDetails.address || '',
                    reference: pdvDetails.reference || '',
                    latitude: pdvDetails.latitude?.toString() || '',
                    longitude: pdvDetails.longitude?.toString() || '',
                    route_id: pdvDetails.route_id?.toString() || '',
                    district_id: pdvDetails.district_id?.toString() || '',
                    locality: pdvDetails.locality || '',
                    // IDs geográficos
                    zonal_id: pdvDetails.zonal_id?.toString() || '',
                    circuit_id: pdvDetails.circuit_id?.toString() || '',
                    departamento_id: pdvDetails.departamento_id?.toString() || '',
                    provincia_id: pdvDetails.provincia_id?.toString() || '',
                }));

                // Cargar listas dependientes en secuencia usando promesas
                const loadSequentially = async () => {
                    // Cargar jerarquía Zonal → Circuito → Ruta
                    if (pdvDetails.zonal_id) {
                        await handleZonalChange(pdvDetails.zonal_id.toString(), true);

                        // Esperar a que se actualicen los circuitos
                        await new Promise(resolve => setTimeout(resolve, 300));

                        if (pdvDetails.circuit_id) {
                            await handleCircuitChange(pdvDetails.circuit_id.toString(), true);
                        }
                    }

                    // Cargar ubicación geográfica paso a paso
                    if (pdvDetails.departamento_id) {
                        await handleDepartamentoChange(pdvDetails.departamento_id.toString(), true);

                        // Esperar a que se actualicen las provincias
                        await new Promise(resolve => setTimeout(resolve, 300));

                        if (pdvDetails.provincia_id) {
                            await handleProvinciaChange(pdvDetails.provincia_id.toString(), true);

                            // Esperar a que se actualicen los distritos
                            await new Promise(resolve => setTimeout(resolve, 300));

                            if (pdvDetails.district_id) {
                                handleDistritoChange(pdvDetails.district_id.toString());
                            }
                        }
                    }
                };

                await loadSequentially();
            }
        } catch (error) {
            console.error('Error cargando datos para edición:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Capturar los query parameters actuales ANTES de enviar la petición
        const currentUrl = new URL(window.location.href);
        const preservedQueryParams = currentUrl.search;

        if (pdv) {
            patch(`/dcs/pdvs/${pdv.id}`, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Limpieza completa después de editar exitosamente
                    clearFormCompletely();
                    onClose();
                    
                    // Recargar la página preservando los query parameters guardados
                    const targetUrl = route('dcs.pdvs.index') + preservedQueryParams;
                    router.get(targetUrl, {}, {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['pdvs', 'businesses', 'zonales', 'allZonales', 'allCircuits', 'circuits', 'allRoutes', 'routes', 'departamentos', 'filters']
                    });
                },
                onError: () => {
                    // No limpiar en caso de error para mantener los datos ingresados
                },
            });
        } else {
            post('/dcs/pdvs', {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Limpieza completa después de crear exitosamente
                    clearFormCompletely();
                    onClose();
                    
                    // Recargar la página preservando los query parameters guardados
                    const targetUrl = route('dcs.pdvs.index') + preservedQueryParams;
                    router.get(targetUrl, {}, {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['pdvs', 'businesses', 'zonales', 'allZonales', 'allCircuits', 'circuits', 'allRoutes', 'routes', 'departamentos', 'filters']
                    });
                },
                onError: () => {
                    // No limpiar en caso de error para mantener los datos ingresados
                },
            });
        }
    };

    const handleClose = () => {
        // Limpieza completa antes de cerrar
        clearFormCompletely();
        onClose();
    };

    const isEditing = !!pdv;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            // Solo permitir cerrar con botones específicos, no con arrastrar
            if (!isOpen) {
                return; // No hacer nada si se intenta cerrar arrastrando
            }
        }}>
            <DialogContent
                className={`max-h-[90vh] overflow-y-auto ${
                    isMobile
                        ? 'w-[100vw] max-w-[100vw] mx-0 rounded-none'
                        : 'w-[85vw] max-w-6xl min-w-[900px]'
                }`}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {isEditing ? 'Editar PDV' : 'Crear Nuevo PDV'}
                        {isMobile && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📱 Móvil
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifica los datos del PDV.' : 'Completa la información para crear un nuevo PDV.'}
                        {isMobile && (
                            <span className="block mt-1 text-xs text-blue-600">
                                💡 Optimizado para dispositivos móviles
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'px-1' : 'space-y-6'}`}>
                    <div className={`grid ${isMobile ? 'gap-3 grid-cols-1' : 'gap-6 grid-cols-1 lg:grid-cols-2'}`}>

                        {/* === SECCIÓN 1: INFORMACIÓN BÁSICA === */}
                        <Card className={isMobile ? 'mx-0' : ''}>
                            <CardHeader className={isMobile ? 'px-2 py-2' : ''}>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    📍 Información Básica del PDV
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
                                <div>
                                    <Label htmlFor="point_name">
                                        Nombre del Punto <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="point_name"
                                        value={data.point_name}
                                        onChange={(e) => setData('point_name', e.target.value.toUpperCase())}
                                        placeholder="Ej: Bodega San José"
                                    />
                                    {errors.point_name && (
                                        <p className="text-sm text-red-500">{errors.point_name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="pos_id">
                                        ID POS (Punto de Venta)
                                    </Label>
                                    <Input
                                        id="pos_id"
                                        value={data.pos_id}
                                        onChange={(e) => setData('pos_id', e.target.value)}
                                        placeholder="Dejar vacío para generar automáticamente"
                                        maxLength={6}
                                    />
                                    {errors.pos_id && (
                                        <p className="text-sm text-red-500">{errors.pos_id}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Si se deja vacío, se generará automáticamente un código único de 6 dígitos
                                    </p>
                                </div>

                                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <div>
                                        <Label htmlFor="classification">
                                            Clasificación <span className="text-red-500">*</span>
                                        </Label>
                                                                    <CustomSelect
                                value={data.classification}
                                onValueChange={(value) => setData('classification', value)}
                                options={[
                                    { value: "telecomunicaciones", label: "Telecomunicaciones" },
                                    { value: "chalequeros", label: "Chalequeros" },
                                    { value: "bodega", label: "Bodega" },
                                    { value: "otras tiendas", label: "Otras Tiendas" },
                                    { value: "desconocida", label: "Desconocida" },
                                    { value: "pusher", label: "Pusher" },
                                    { value: 'minimarket', label: 'Minimarket' },
                                    { value: 'botica', label: 'Bótica' },
                                    { value: 'farmacia', label: 'Farmacia' },
                                    { value: 'tambo', label: 'Tambo' },
                                    { value: 'cencosud', label: 'Cencosud' }
                                ]}
                                placeholder="Seleccionar clasificación"
                            />
                                    </div>

                                    <div>
                                        <Label htmlFor="status">
                                            Estado <span className="text-red-500">*</span>
                                        </Label>
                                                                    <CustomSelect
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                                options={[
                                    { value: "vende", label: "Vende" },
                                    { value: "no vende", label: "No Vende" },
                                    { value: "no existe", label: "No Existe" },
                                    { value: "pdv autoactivado", label: "PDV Autoactivado" },
                                    { value: "pdv impulsador", label: "PDV Impulsador" }
                                ]}
                                placeholder="Seleccionar estado"
                            />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sells_recharge"
                                        checked={data.sells_recharge}
                                        onCheckedChange={(checked) => setData('sells_recharge', !!checked)}
                                    />
                                    <Label htmlFor="sells_recharge" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        🔋 Vende Recargas
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* === SECCIÓN 2: INFORMACIÓN DEL CLIENTE === */}
                        <Card className={isMobile ? 'mx-0' : ''}>
                            <CardHeader className={isMobile ? 'px-2 py-2' : ''}>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    👤 Información del Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
                                <div>
                                    <Label htmlFor="client_name">
                                        Nombre del Cliente <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="client_name"
                                        value={data.client_name}
                                        onChange={(e) => setData('client_name', e.target.value.toUpperCase())}
                                        placeholder="Nombre completo del cliente"
                                    />
                                    {errors.client_name && (
                                        <p className="text-sm text-red-500">{errors.client_name}</p>
                                    )}
                                </div>

                                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <div>
                                        <Label htmlFor="document_type">
                                            Tipo de Documento <span className="text-red-500">*</span>
                                        </Label>
                                        <CustomSelect
                                            value={data.document_type}
                                            onValueChange={(value) => setData('document_type', value as 'DNI' | 'RUC')}
                                            options={[
                                                { value: "DNI", label: "DNI" },
                                                { value: "RUC", label: "RUC" }
                                            ]}
                                            placeholder="Tipo de documento"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="document_number">
                                            Número de Documento <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="document_number"
                                            value={data.document_number}
                                            onChange={(e) => setData('document_number', e.target.value)}
                                            placeholder={data.document_type === 'DNI' ? '12345678' : '12345678901'}
                                        />
                                        {errors.document_number && (
                                            <p className="text-sm text-red-500">{errors.document_number}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="999 888 777"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* === SECCIÓN 3: ASIGNACIÓN DE RUTA === */}
                        <Card className={isMobile ? 'mx-0' : ''}>
                            <CardHeader className={isMobile ? 'px-2 py-2' : ''}>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🚚 Asignación de Ruta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
                                <div>
                                    <Label htmlFor="zonal">
                                        Zonal <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.zonal_id}
                                        onValueChange={(value) => {
                                            setData('zonal_id', value);
                                            handleZonalChange(value, false);
                                        }}
                                        options={zonales.map(zonal => ({
                                            value: zonal.id.toString(),
                                            label: zonal.name
                                        }))}
                                        placeholder="Seleccionar zonal"
                                    />
                                    {errors.zonal_id && (
                                        <p className="text-sm text-red-500">{errors.zonal_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="circuit">
                                        Circuito <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.circuit_id}
                                        onValueChange={(value) => {
                                            setData('circuit_id', value);
                                            handleCircuitChange(value, false);
                                        }}
                                        disabled={availableCircuits.length === 0}
                                        options={availableCircuits.map(circuit => ({
                                            value: circuit.id.toString(),
                                            label: `${circuit.name} (${circuit.code})`
                                        }))}
                                        placeholder={loadingCircuits ? "Cargando..." : "Seleccionar circuito"}
                                    />
                                    {errors.circuit_id && (
                                        <p className="text-sm text-red-500">{errors.circuit_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="route_id">
                                        Ruta <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.route_id}
                                        onValueChange={(value) => setData('route_id', value)}
                                        disabled={availableRoutes.length === 0}
                                        options={availableRoutes.map(route => ({
                                            value: route.id.toString(),
                                            label: `${route.name} (${route.code})`
                                        }))}
                                        placeholder={loadingRoutes ? "Cargando..." : "Seleccionar ruta"}
                                    />
                                    {errors.route_id && (
                                        <p className="text-sm text-red-500">{errors.route_id}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* === SECCIÓN 4: UBICACIÓN GEOGRÁFICA === */}
                        <Card className={isMobile ? 'mx-0' : ''}>
                            <CardHeader className={isMobile ? 'px-2 py-2' : ''}>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🌍 Ubicación Geográfica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
                                <div>
                                    <Label htmlFor="departamento">
                                        Departamento <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.departamento_id}
                                        onValueChange={(value) => handleDepartamentoChange(value, false)}
                                        options={departamentos.map(dept => ({
                                            value: dept.id.toString(),
                                            label: dept.name
                                        }))}
                                        placeholder="Seleccionar departamento"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="provincia">
                                        Provincia <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.provincia_id}
                                        onValueChange={(value) => handleProvinciaChange(value, false)}
                                        disabled={provincias.length === 0}
                                        options={provincias.map(prov => ({
                                            value: prov.id.toString(),
                                            label: prov.name
                                        }))}
                                        placeholder={loadingProvincias ? "Cargando..." : "Seleccionar provincia"}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="distrito">
                                        Distrito <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.district_id}
                                        onValueChange={(value) => handleDistritoChange(value)}
                                        disabled={distritos.length === 0}
                                        options={distritos.map(dist => ({
                                            value: dist.id.toString(),
                                            label: dist.name
                                        }))}
                                        placeholder={loadingDistritos ? "Cargando..." : "Seleccionar distrito"}
                                    />
                                    {errors.district_id && (
                                        <p className="text-sm text-red-500">{errors.district_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="locality">
                                        Localidad <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="locality"
                                        value={data.locality}
                                        onChange={(e) => setData('locality', e.target.value.toUpperCase())}
                                        placeholder="Nombre de la localidad"
                                    />
                                    {errors.locality && (
                                        <p className="text-sm text-red-500">{errors.locality}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="address">
                                        Dirección <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value.toUpperCase())}
                                        placeholder="Dirección completa del PDV"
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-500">{errors.address}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="reference">Referencia</Label>
                                    <Input
                                        id="reference"
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value.toUpperCase())}
                                        placeholder="Punto de referencia adicional"
                                    />
                                    {errors.reference && (
                                        <p className="text-sm text-red-500">{errors.reference}</p>
                                    )}
                                </div>

                                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <div>
                                        <Label htmlFor="latitude">Latitud (X)</Label>
                                        <Input
                                            id="latitude"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            placeholder="-12.0464"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude">Longitud (Y)</Label>
                                        <Input
                                            id="longitude"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            placeholder="-77.0428"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* === SECCIÓN 5: MAPA === */}
                    {!isMobile && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🗺️ Ubicación en el Mapa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MapSelector
                                    latitude={data.latitude ? parseFloat(data.latitude) : undefined}
                                    longitude={data.longitude ? parseFloat(data.longitude) : undefined}
                                    address={data.address}
                                    focusLocation={mapFocusLocation}
                                    onLocationChange={(lat, lng, addr) => {
                                        // Solo actualizar si hay cambios reales
                                        const newLat = lat.toString();
                                        const newLng = lng.toString();
                                        const newAddr = addr || data.address;

                                        if (newLat !== data.latitude || newLng !== data.longitude || newAddr !== data.address) {
                                            setData(prev => ({
                                                ...prev,
                                                latitude: newLat,
                                                longitude: newLng,
                                                address: newAddr
                                            }));
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Mapa para móvil - Optimizado pero completo */}
                    {isMobile && (
                        <Card className="mx-0">
                            <CardHeader className="px-2 py-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🗺️ Ubicación en el Mapa
                                    <span className="text-xs text-blue-600">
                                        (Móvil)
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-2">
                                <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                                    {/* Mapa optimizado para móvil */}
                                    <MapSelector
                                        latitude={data.latitude ? parseFloat(data.latitude) : undefined}
                                        longitude={data.longitude ? parseFloat(data.longitude) : undefined}
                                        address={data.address}
                                        focusLocation={mapFocusLocation}
                                        isMobile={isMobile}
                                        onLocationChange={(lat, lng, addr) => {
                                            // Solo actualizar si hay cambios reales
                                            const newLat = lat.toString();
                                            const newLng = lng.toString();
                                            const newAddr = addr || data.address;

                                            if (newLat !== data.latitude || newLng !== data.longitude || newAddr !== data.address) {
                                                setData(prev => ({
                                                    ...prev,
                                                    latitude: newLat,
                                                    longitude: newLng,
                                                    address: newAddr
                                                }));
                                            }
                                        }}
                                    />


                                    {/* Tip para móvil */}
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs text-blue-800">
                                            💡 <strong>Tip móvil:</strong> Puedes hacer zoom y arrastrar el mapa para buscar direcciones, o usar el botón de arriba para obtener tu ubicación actual.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    <DialogFooter className={`${isMobile ? 'flex-col gap-2 px-2' : 'flex-row gap-3'}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className={`border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer ${
                                isMobile ? 'w-full' : ''
                            }`}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className={`bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ${
                                isMobile ? 'w-full' : ''
                            }`}
                        >
                            {processing ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
