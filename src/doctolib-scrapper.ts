import axios from 'axios';
import type { CenterBookingInfo } from "~/types/doctolib-api";

async function getCenterInfo(url: string): Promise<CenterBookingInfo | null> {
    let centerName: string;
    try {
        centerName = new URL(url).pathname.split('/')[3];
    } catch {
        console.error('This doctolib URL is not valid', url);
        return null;
    }

    const { data } = await axios.get(`https://www.doctolib.fr/booking/${centerName}.json`);
    return data.data as CenterBookingInfo;
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
