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
    locality_id: number;
    route?: { name: string; circuit?: { name: string } };
    locality?: { name: string };
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
    route_id: string;
    locality_id: string;
    departamento_id: string;
    provincia_id: string;
    distrito_id: string;
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
        route_id: '',
        locality_id: '',
        departamento_id: '',
        provincia_id: '',
        distrito_id: '',
    });

    // Estados para carga dinámica
    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
    const [provincias, setProvincias] = useState<GeographicItem[]>([]);
    const [distritos, setDistritos] = useState<GeographicItem[]>([]);
    const [localidades, setLocalidades] = useState<GeographicItem[]>([]);
    const [loadingProvincias, setLoadingProvincias] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);
    const [loadingLocalidades, setLoadingLocalidades] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Cargar rutas cuando cambia el circuito
    const handleCircuitChange = async (circuitId: string) => {
        if (!circuitId) {
            setAvailableRoutes([]);
            setData('route_id', '');
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
    const handleDepartamentoChange = async (departamentoId: string) => {
        setData('departamento_id', departamentoId);
        setData('provincia_id', '');
        setData('distrito_id', '');
        setData('locality_id', '');
        setProvincias([]);
        setDistritos([]);
        setLocalidades([]);

        if (!departamentoId) return;

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
    const handleProvinciaChange = async (provinciaId: string) => {
        setData('provincia_id', provinciaId);
        setData('distrito_id', '');
        setData('locality_id', '');
        setDistritos([]);
        setLocalidades([]);

        if (!provinciaId) return;

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

    // Cargar localidades cuando cambia el distrito
    const handleDistritoChange = async (distritoId: string) => {
        setData('distrito_id', distritoId);
        setData('locality_id', '');
        setLocalidades([]);

        if (!distritoId) return;

        setLoadingLocalidades(true);
        try {
            const response = await fetch(`/dcs/ajax/localidades?distrito_id=${distritoId}`);
            const localidades = await response.json();
            setLocalidades(localidades);
        } catch (error) {
            console.error('Error cargando localidades:', error);
        } finally {
            setLoadingLocalidades(false);
        }
    };

    // Efectos para cargar datos del PDV en edición (evitar bucles)
    useEffect(() => {
        if (open && pdv) {
            setData({
                point_name: pdv.point_name || '',
                document_type: pdv.document_type || 'DNI',
                document_number: pdv.document_number || '',
                client_name: pdv.client_name || '',
                phone: pdv.phone || '',
                classification: pdv.classification || 'bodega',
                status: pdv.status || 'vende',
                sells_recharge: pdv.sells_recharge ?? false,
                address: pdv.address || '',
                reference: pdv.reference || '',
                latitude: pdv.latitude?.toString() || '',
                longitude: pdv.longitude?.toString() || '',
                route_id: pdv.route_id?.toString() || '',
                locality_id: pdv.locality_id?.toString() || '',
                departamento_id: '',
                provincia_id: '',
                distrito_id: '',
            });
        } else if (open && !pdv) {
            reset();
            setAvailableRoutes([]);
            setProvincias([]);
            setDistritos([]);
            setLocalidades([]);
        }
    }, [open, pdv?.id]); // Solo depender del ID del PDV para evitar bucles

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
                                        onValueChange={handleCircuitChange}
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
                                        onValueChange={handleDepartamentoChange}
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
                                        onValueChange={handleProvinciaChange}
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
                                        value={data.distrito_id}
                                        onValueChange={handleDistritoChange}
                                        disabled={distritos.length === 0}
                                        options={distritos.map(dist => ({
                                            value: dist.id.toString(),
                                            label: dist.name
                                        }))}
                                        placeholder={loadingDistritos ? "Cargando..." : "Seleccionar distrito"}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="locality">
                                        Localidad <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomSelect
                                        value={data.locality_id}
                                        onValueChange={(value) => setData('locality_id', value)}
                                        disabled={localidades.length === 0}
                                        options={localidades.map(loc => ({
                                            value: loc.id.toString(),
                                            label: loc.name
                                        }))}
                                        placeholder={loadingLocalidades ? "Cargando..." : "Seleccionar localidad"}
                                    />
                                    {errors.locality_id && (
                                        <p className="text-sm text-red-500">{errors.locality_id}</p>
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
