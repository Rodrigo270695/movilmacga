// Tipos compartidos para el sistema de tracking

export interface User {
    id: number;
    name: string; // Nombre completo que se usa en el frontend
    first_name: string;
    last_name: string;
    email: string;
    current_location?: GpsLocation; // Para indicar si está en línea
    active_working_sessions: WorkingSession[];
        active_user_circuits: Array<{
        id: number;
        circuit_id: number;
        is_active: boolean;
        assigned_date: string;
        circuit: {
            id: number;
            name: string;
            code?: string;
            zonal: {
                id: number;
                name: string;
            };
        }
    }>;
    // También puede venir como activeUserCircuits (camelCase desde Laravel)
    activeUserCircuits?: Array<{
        id: number;
        circuit_id: number;
        is_active: boolean;
        assigned_date: string;
        circuit: {
            id: number;
            name: string;
            code?: string;
            zonal: {
                id: number;
                name: string;
            };
        }
    }>;
}

export interface WorkingSession {
    id: number;
    started_at: string;
    ended_at?: string;
}

export interface Circuit {
    id: number;
    name: string;
    code: string;
}

export interface Zonal {
    id: number;
    name: string;
    business: { id: number; name: string };
}

export interface GpsLocation {
    id: number;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    battery_level?: number;
    is_mock_location: boolean;
    recorded_at: string;
    user: User;
}

export interface UserStats {
    total_sessions: number;
    working_hours: number;
    distance_traveled: number;
    pdv_visits: number;
    programmed_pdvs: number;
    compliance_percentage: number;
    last_activity: string;
    route_coordinates: Array<{ latitude: number; longitude: number; recorded_at: string }>;
    pdv_visits_detail: Array<{ pdv: string; visited_at: string; duration?: number }>;
}

export interface Stats {
    total_users: number;
    online_users: number;
    active_sessions: number;
    total_circuits: number;
}

export interface Pdv {
    id: number;
    point_name: string;
    pos_id?: string;
    client_name: string;
    document_type: 'DNI' | 'RUC';
    document_number: string;
    email?: string;
    phone?: string;
    sells_recharge: boolean;
    classification: 'telecomunicaciones' | 'chalequeros' | 'bodega' | 'otras tiendas' | 'desconocida' | 'pusher';
    status: 'vende' | 'no vende' | 'no existe' | 'pdv autoactivado' | 'pdv impulsador';
    address: string;
    reference?: string;
    latitude: number;
    longitude: number;
    route: {
        id: number;
        name: string;
        code: string;
        circuit: {
            id: number;
            name: string;
            code: string;
            zonal: {
                id: number;
                name: string;
                business?: {
                    id: number;
                    name: string;
                };
            };
        };
    };
    locality?: {
        id: number;
        name: string;
        distrito?: {
            id: number;
            name: string;
            provincia?: {
                id: number;
                name: string;
                departamento?: {
                    id: number;
                    name: string;
                };
            };
        };
    };
}

export interface PdvVisit {
    id: number;
    check_in_at: string;
    check_out_at?: string;
    duration_minutes?: number;
    duration_formatted: string;
    visit_status: 'in_progress' | 'completed' | 'cancelled';
    visit_status_label: string;
    is_valid: boolean;
    distance_to_pdv?: number;
    visit_photo?: string;
    notes?: string;
    visit_data?: any;
    coordinates: [number, number];
    pdv: {
        id: number;
        point_name: string;
        client_name: string;
        pos_id?: string;
        address: string;
        latitude: number;
        longitude: number;
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
                zonal?: {
                    id: number;
                    name: string;
                    business?: {
                        id: number;
                        name: string;
                    };
                };
            };
        };
    };
}
