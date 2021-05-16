// https://www.doctolib.fr/booking/${centerName}.json response
export interface CenterBookingInfo {
    profile: {
        id: number;
        name_with_title_and_determiner: string; // "Centre de vaccination covid-19 - Centre XXX"
        // other info
    };
    specialities: Array<{
        id: number; // 5494
        name: string; // "Vaccination COVID-19"
        kind: string; // "subspeciality"
    }>;
    visit_motives: Array<{
        id: number;
        name: string; // "1re injection vaccin COVID-19 (Pfizer-BioNTech)"
        // other info
    }>;
    agendas: Array<{
        id: number;
        booking_disabled: boolean;
        booking_temporary_disabled: boolean;
        landline_number: string;
        anonymous: boolean;
        organization_id: number;
        visit_motive_ids: number[];
        // other info
    }>;
}
