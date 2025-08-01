// Tipos compartidos para el sistema de tracking

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    active_working_sessions: WorkingSession[];
    active_user_circuits: Array<{ circuit: { name: string; code?: string } }>;
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
