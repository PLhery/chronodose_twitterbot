import axios from 'axios';
import type { CenterBookingInfo } from '~/types/doctolib-api';

async function getCenterInfo(url: string): Promise<CenterBookingInfo> {
    const centerName = new URL(url).pathname.split('/')[3];

    const { data } = await axios.get(`https://www.doctolib.fr/booking/${centerName}.json`);
    return data.data as CenterBookingInfo;
}

/**
 * Fetches today and tomorrow's doctolib slots, trying to bypass cache, to make sure there are still slots available
 * /!\ may throw an error (if the url is not valid ; a 403 if you're limited by cloudflare)
 * @param url the doctolib booking URL
 */
export async function getNumberOfAvailableSlots(url: string): Promise<number> {
    const centerInfo = await getCenterInfo(url);

    const motiveIdsStr = centerInfo.visit_motives
        .filter((motive) => motive.name.match(/1 ?e?è?re? (injection|dose)/gi))
        .map((motive) => motive.id)
        .join('-');
    const agendaIdsStr = centerInfo.agendas.map((agenda) => agenda.id).join('-');
    const secondsSinceTheHour = Math.floor(Date.now() / 1000) % 3600; // will be used to bypasss the cache

    const bookingUrl =
        `https://www.doctolib.fr/availabilities.json?` +
        `start_date=${new Date().toISOString().substring(0, 10)}` +
        `&visit_motive_ids=${motiveIdsStr}-${secondsSinceTheHour}` + // -[a number < 2.8e6] to bypass the cache
        `&agenda_ids=${agendaIdsStr}` +
        `&insurance_sector=public&practice_ids=180683&destroy_temporary=true&limit=2`; // limit=2 => 2 days of slots

    const { data } = await axios.get(bookingUrl);

    return data.total;
}
