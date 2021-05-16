// Packages
import axios from 'axios';
import TwitterApi from 'twitter-api-v2';
import StaticMaps from 'staticmaps';

import emojiSet from '~/emojis';
import { getNumberOfAvailableSlots } from '~/doctolib-scrapper';
import { generateValidTweet, generateMessage } from '~/twitter/message';

// Dotenv
import dotenv from 'dotenv';
dotenv.config();

// Types
import { viteMaDoseData, CenterData } from './types/viteMaDoseApi';

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

// don't tweet if less than MIN_SLOTS are available, because it's probably already too late
const MIN_SLOTS = Number(process.env.MIN_SLOTS) || Number(process.env.MIN_DOSES) || 0;
const TIMEZONE = process.env.TIMEZONE || 'Europe/Paris';

// avoid tweeting twice the same message (using a specified ID)
const alreadyTweeted = new Set<string>();

function generateMapImg(center: CenterData) {
    const map = new StaticMaps({
        width: 600,
        height: 400,
    });
    map.addMarker({
        coord: [center.location.longitude, center.location.latitude],
        img: 'marker.png',
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
    const { data }: { data: viteMaDoseData } = await axios.get(
        `https://vitemadose.gitlab.io/vitemadose/${addZero(department)}.json`
    );
    console.log(`${emojiSet.paws} fetched db ${department}`);

    const promises = data.centres_disponibles
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
            const id = `${center.url} - ${center.prochain_rdv} - ${nbSlots}`;
            if (alreadyTweeted.has(id)) {
                return;
            }
            alreadyTweeted.add(id);

            // On doctolib, double-check the slot is still available, bypassing the cache
            if (center.plateforme === 'Doctolib') {
                const actualNbSlots = await getNumberOfAvailableSlots(center.url);
                console.log(`${actualNbSlots} slots found on doctolib.fr`);
                if (actualNbSlots === 0) {
                    return;
                }
            }

            const intro =
                `${emojiSet.syringe} ` + (nbSlots === 1 ? `1 créneau disponible` : `${nbSlots} créneaux disponibles`);
            const calendarDate = getCalendarDate(center);
            const message = generateMessage(center, intro, calendarDate);
            const tweet = generateValidTweet(message);
            const map = generateMapImg(center);

            // generate the map image before tweeting...
            console.log(`${emojiSet.map}  generating the map...`);
            await map.render(undefined, 12);

            // tweet
            console.log(`${emojiSet.incEnvelope} uploading the media...`);
            const mediaId = await twitterClient.v1.uploadMedia(await map.image.buffer(), { type: 'png' });
            console.log(`${emojiSet.bird} tweeting...`);
            await twitterClient.v1.tweet(tweet ? tweet : '', { media_ids: mediaId });
        });
    await Promise.all(promises).catch((err) => console.error(err));
}

function addZero(department: number) {
    return department < 10 ? `0${department}` : department;
}

export function checkDepartments(departments: number[]): unknown {
    return Promise.all(departments.map((department) => tweetDeptData(department)));
}
