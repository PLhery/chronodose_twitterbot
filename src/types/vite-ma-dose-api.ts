// https://vitemadose.gitlab.io/vitemadose/${addZero(department)}.json response
export interface ViteMaDoseCenterList {
    centres_disponibles: Array<CenterData>;
    centres_indisponibles: Array<CenterData>;
    last_scrap: unknown;
    last_updated: Date;
    version: number;
}

export interface CenterData {
    internal_id: string;
    gid: string;
    nom: string;
    url: string;
    location: {
        longitude: number;
        latitude: number;
        city: string;
        cp: string;
    };
    metadata: {
        address: string;
        business_hours: unknown;
    };
    appointment_schedules: Array<{
        name: string;
        from: string;
        to: string;
        total: number;
    }>;
    appointment_count: number;
    appointment_by_phone_only: boolean;
    plateforme: string;
    request_counts?: {
        motives: number;
        slots: number;
    };
    type?: string;
    prochain_rdv: Date;
    vaccine_type?: string[];
    last_scan_with_availabilities: Date;
    erreur: unknown;
    departement: string;
}
