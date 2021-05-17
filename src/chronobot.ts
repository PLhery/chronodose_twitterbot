// Packages
import axios from 'axios';
import TwitterApi from 'twitter-api-v2';
import StaticMaps from 'staticmaps';

import emojiSet from './emojis';
import { getNumberOfAvailableSlots } from './doctolib-scrapper';

// Dotenv
import dotenv from 'dotenv';
dotenv.config();

// Types
import type { ViteMaDoseCenterList, CenterData } from './types/vite-ma-dose-api';

// Dayjs
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(calendar);
dayjs.extend(utc);
dayjs.extend(timezone);

const twitterClient = new TwitterApi({
    appKey: process.env.APP_KEY!,
    appSecret: process.env.APP_SECRET!,
    accessToken: process.env.ACCESS_TOKEN!,
    accessSecret: process.env.ACCESS_SECRET!,
});

if (!process.env.DEPARTMENTS_TO_CHECK) {
    console.error('please set the DEPARTMENTS_TO_CHECK env variable');
    process.exit(0);
}

const CHECK_INTERVAL_SEC = Number(process.env.CHECK_INTERVAL_SEC) || 60; // check every X seconds
// don't tweet if less than MIN_SLOTS are available, because it's probably already too late
const MIN_SLOTS = Number(process.env.MIN_SLOTS) || Number(process.env.MIN_DOSES) || 0;
const TIMEZONE = process.env.TIMEZONE || 'Europe/Paris';
const GID_BLACKLIST = process.env.GID_BLACKLIST ? process.env.GID_BLACKLIST.split(',') : [];

// avoid tweeting twice the same message (using a specified ID)
const alreadyTweeted = new Set<string>();

function generateMessage(center: CenterData, nbSlots: number, calendarDate: string): string {
    const message =
        `${emojiSet.syringe} ${nbSlots === 1 ? `Un créneau disponible` : `${nbSlots} créneaux disponibles`}\n` +
        `${emojiSet.calendar} ${calendarDate}\n` +
        `${emojiSet.hospital} ${center.nom} (${center.vaccine_type})\n` +
        `${emojiSet.playButton} ${center.url}\n` +
        `${emojiSet.pin} ${center.metadata.address}`;
    console.log(message);

    // URLs are shortened to a 28chars url, and the tweet can be 280chars long
    // so if the URL is 30 chars, our unshortened message can be 280 + 2 = 282 chars long
    const maxMessageLength = 280 + center.url.length - 28;

    // If we have to truncate but the address contains a ',', first try to shorten the address
    if ([...message].length > maxMessageLength && center.metadata.address.includes(',')) {
        // clone the center with a different address, removing the part before the first ','
        // (usually the format is NUMBER STREETNAME, ZIPCODE CITY)
        const centerWithSmallerAddress = {
            ...center,
            metadata: {
                ...center.metadata,
                address: center.metadata.address.split(',').slice(1).join(',').trim(),
            },
        };
        return generateMessage(centerWithSmallerAddress, nbSlots, calendarDate);
    }

    // ex. simple emojis have a length 2 in js, hence the [...message] which splits correctly chars
    return [...message].slice(0, maxMessageLength).join('');
}

function generateMapImg(center: CenterData) {
    const map = new StaticMaps({
        width: 600,
        height: 400,
    });
    map.addMarker({
        coord: [center.location.longitude, center.location.latitude],
        img: `${__dirname}/../marker.png`,
        height: 40,
        width: 40,
    });
    return map;
}

function getCalendarDate(center: CenterData) {
    return dayjs(center.prochain_rdv).tz(TIMEZONE).calendar(dayjs(), {
        sameDay: "[Aujourd'hui à] H:mm",
        nextDay: '[Demain à] H:mm',
        sameElse: 'Le DD/MM/YYYY à H:mm',
    });
}

async function tweetDeptData(department: number) {
    console.log(`${emojiSet.dog} fetching db ${department}...`);
    const { data }: { data: ViteMaDoseCenterList } = await axios.get(
        `https://vitemadose.gitlab.io/vitemadose/${addZero(department)}.json`
    );
    console.log(`${emojiSet.paws} fetched db ${department}`);

    const promises = data.centres_disponibles
        .filter((center) => !GID_BLACKLIST.includes(center.gid))
        .filter((center) =>
            center.appointment_schedules.some((schedule) => schedule.name === 'chronodose' && schedule.total > 0)
        )
        .map(async (center: CenterData) => {
            // count the number of doses
            const nbSlots = center.appointment_schedules
                .filter((schedule) => schedule.name === 'chronodose')
                .reduce((nb, schedule) => nb + schedule.total, 0);

            if (nbSlots < MIN_SLOTS) {
                return;
            }

            // don't tweet twice the same info
            const id = `${center.url} - ${center.prochain_rdv}`;
            if (alreadyTweeted.has(id)) {
                return;
            }
            alreadyTweeted.add(id);

            // On doctolib, double-check the slot is still available, bypassing the cache
            if (center.plateforme === 'Doctolib') {
                try {
                    const actualNbSlots = await getNumberOfAvailableSlots(center.url);
                    console.log(`${actualNbSlots} slots found on doctolib.fr`);
                    if (actualNbSlots === 0) {
                        return;
                    }
                } catch (error) {
                    if (error.response) {
                        // axios - doctolib http error
                        console.error(error.response.data);
                        console.error(error.response.status);
                        console.error(error.response.headers);
                    } else if (error.request) {
                        // axios - http request error
                        console.error(error.request);
                    } else {
                        // other - ex. wrong URL format
                        console.error('Error', error.message);
                    }
                }
            }

            const calendarDate = getCalendarDate(center);
            const message = generateMessage(center, nbSlots, calendarDate);
            const map = generateMapImg(center);

            // generate the map image before tweeting...
            console.log(`${emojiSet.map}  generating the map...`);
            await map.render(undefined, 12);

            // tweet
            console.log(`${emojiSet.incEnvelope} uploading the media...`);
            const mediaId = await twitterClient.v1.uploadMedia(await map.image.buffer(), { type: 'png' });
            console.log(`${emojiSet.bird} tweeting...`);
            await twitterClient.v1.tweet(message, { media_ids: mediaId });
        });
    await Promise.all(promises).catch((err) => console.error(err));
}

function addZero(department: number) {
    return department < 10 ? `0${department}` : department;
}

function checkDepartments(departments: number[]) {
    return Promise.all(departments.map((department) => tweetDeptData(department)));
}

const DEPARTMENTS_TO_CHECK = process.env.DEPARTMENTS_TO_CHECK!.split(',').map(Number);
checkDepartments(DEPARTMENTS_TO_CHECK);
setInterval(() => checkDepartments(DEPARTMENTS_TO_CHECK), CHECK_INTERVAL_SEC * 1000);
