import axios from 'axios';

interface CenterInfo {
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

async function getCenterInfo(url: string): Promise<CenterInfo | null> {
    let centerName: string;
    try {
        centerName = new URL(url).pathname.split('/')[3];
    } catch {
        return null;
    }

    const { data } = await axios.get(`https://www.doctolib.fr/booking/${centerName}.json`);
    return data.data as CenterInfo;
}

/**
 * Fetches today and tomorrow's doctolib slots, trying to bypass cache, to make sure there are still slots available
 * @param url the doctolib booking URL
 */
export async function getNumberOfAvailableSlots(url: string): Promise<number> {
    const centerInfo = await getCenterInfo(url);

    if (!centerInfo) {
        // URL issue
        return 0;
    }

    const motiveIdsStr = centerInfo.visit_motives
        .filter((motive) => motive.name.match(/1 ?e?è?re? (injection|dose)/gi))
        .map((motive) => motive.id)
        .join('-');

    const agendaIdsStr = centerInfo.agendas.map((agenda) => agenda.id).join('-');

    const bookingUrl =
        `https://www.doctolib.fr/availabilities.json?` +
        `start_date=${new Date().toISOString().substring(0, 10)}` +
        `&visit_motive_ids=${motiveIdsStr}-1234` + // -1234 to bypass the cache
        `&agenda_ids=${agendaIdsStr}` +
        `&insurance_sector=public&practice_ids=180683&destroy_temporary=true&limit=2`; // limit=2 => 2 days of slots

    const { data } = await axios.get(bookingUrl);

    return data.total;
}
