import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
    circuits: Circuit[];
    departamentos: Departamento[];
}

interface FormData {
    point_name: string;
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
    circuits,
    departamentos
}: Props) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<FormData>({
        point_name: '',
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
        circuit_id: '',
        route_id: '',
        district_id: '',
        locality: '',
        departamento_id: '',
        provincia_id: '',
    });

    // Estados para carga dinámica
    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
    const [provincias, setProvincias] = useState<GeographicItem[]>([]);
    const [distritos, setDistritos] = useState<GeographicItem[]>([]);
    const [loadingProvincias, setLoadingProvincias] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Estado para enfoque dinámico del mapa
    const [mapFocusLocation, setMapFocusLocation] = useState<string>('');

    // Cargar rutas cuando cambia el circuito
    const handleCircuitChange = async (circuitId: string, keepValues = false) => {
        if (!circuitId) {
            setAvailableRoutes([]);
            if (!keepValues) {
                setData('route_id', '');
            }
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

    // Efectos para cargar datos del PDV en edición
    useEffect(() => {
        if (open && pdv) {
            // Cargar datos dependientes para edición (incluye setData)
            loadEditingData();
        } else if (open && !pdv) {
            reset();
            setAvailableRoutes([]);
            setProvincias([]);
            setDistritos([]);
            setMapFocusLocation(''); // Limpiar enfoque del mapa para nuevo PDV
        }
    }, [open, pdv?.id]); // Solo depender del ID del PDV para evitar bucles

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
                    circuit_id: pdvDetails.circuit_id?.toString() || '',
                    departamento_id: pdvDetails.departamento_id?.toString() || '',
                    provincia_id: pdvDetails.provincia_id?.toString() || '',
                }));

                // Cargar listas dependientes en secuencia usando promesas
                const loadSequentially = async () => {
                    // Cargar circuito y rutas
                    if (pdvDetails.circuit_id) {
                        await handleCircuitChange(pdvDetails.circuit_id.toString(), true);
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

                            if (pdvDetails.provincia_id) {
                                handleDistritoChange(pdvDetails.district_id?.toString() || '');
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

        if (pdv) {
            patch(`/dcs/pdvs/${pdv.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/dcs/pdvs', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const handleClose = () => {
        onClose();
        reset();
        setMapFocusLocation(''); // Limpiar enfoque del mapa
    };

    const isEditing = !!pdv;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-6xl max-h-[90vh] overflow-y-auto"
                style={{ width: '85vw', maxWidth: '1200px', minWidth: '900px' }}
                onClose={() => handleClose(false)}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isEditing ? 'Editar PDV' : 'Crear Nuevo PDV'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifica los datos del PDV.' : 'Completa la información para crear un nuevo PDV.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* === SECCIÓN 1: INFORMACIÓN BÁSICA === */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    📍 Información Básica del PDV
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="point_name">
                                        Nombre del Punto <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="point_name"
                                        value={data.point_name}
                                        onChange={(e) => setData('point_name', e.target.value)}
                                        placeholder="Ej: Bodega San José"
                                    />
                                    {errors.point_name && (
                                        <p className="text-sm text-red-500">{errors.point_name}</p>
                                    )}
                                </div>



                                <div className="grid grid-cols-2 gap-4">
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
                                    { value: "pusher", label: "Pusher" }
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    👤 Información del Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="client_name">
                                        Nombre del Cliente <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="client_name"
                                        value={data.client_name}
                                        onChange={(e) => setData('client_name', e.target.value)}
                                        placeholder="Nombre completo del cliente"
                                    />
                                    {errors.client_name && (
                                        <p className="text-sm text-red-500">{errors.client_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🚚 Asignación de Ruta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        options={circuits.map(circuit => ({
                                            value: circuit.id.toString(),
                                            label: `${circuit.name} (${circuit.code})`
                                        }))}
                                        placeholder="Seleccionar circuito"
                                    />
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🌍 Ubicación Geográfica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        onChange={(e) => setData('locality', e.target.value)}
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
                                        onChange={(e) => setData('address', e.target.value)}
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
                                        onChange={(e) => setData('reference', e.target.value)}
                                        placeholder="Punto de referencia adicional"
                                    />
                                    {errors.reference && (
                                        <p className="text-sm text-red-500">{errors.reference}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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

                    <Separator />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        >
                            {processing ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
