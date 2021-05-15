import axios from 'axios';
import TwitterApi from 'twitter-api-v2';
import StaticMaps from 'staticmaps';

import dotenv from 'dotenv';
dotenv.config();

import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(calendar);
dayjs.extend(utc);
dayjs.extend(timezone);

import { getNumberOfAvailableSlots } from './doctolib-scrapper';

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

const DEPARTMENTS_TO_CHECK = process.env.DEPARTMENTS_TO_CHECK!.split(',').map(Number);
const CHECK_INTERVAL_SEC = Number(process.env.CHECK_INTERVAL_SEC) || 60; // check every X seconds
// don't tweet if less than MIN_SLOTS are available, because it's probably already too late
const MIN_SLOTS = Number(process.env.MIN_SLOTS) || Number(process.env.MIN_DOSES) || 0;
const TIMEZONE = process.env.TIMEZONE || 'Europe/Paris';

// partial data
interface viteMaDoseData {
  centres_disponibles: Array<{
    nom: string;
    url: string;
    plateforme: string;
    location: {
      longitude: number;
      latitude: number;
      city: string;
    }
    metadata: {
      address: string;
    }
    appointment_schedules: Array<{
      name: string;
      from: string;
      to: string;
      total: number;
    }>;
    prochain_rdv: string;
    vaccine_type?: string[];
  }>
}

// avoid tweeting twice the same message (using a specified ID)
const alreadyTweeted = new Set<string>();

async function checkDepartment(department: number) {

  console.log(`fetching db ${department}...`);
  const { data }: { data: viteMaDoseData } =
    await axios.get(`https://vitemadose.gitlab.io/vitemadose/${addZero(department)}.json`);
  console.log(`fetched db ${department}`);

  const promises = data.centres_disponibles
    // .filter(centre => centre.vaccine_type?.includes('Pfizer-BioNTech') || centre.vaccine_type?.includes('Moderna'))
    // .filter(centre => (new Date(centre.prochain_rdv).getTime() - Date.now()) < 24 * 60 * 60 * 1000)
    .filter(centre => centre.appointment_schedules
      .some(schedule => schedule.name === 'chronodose' && schedule.total > 0)
    )
    .map(async (centre) => {
      // count the number of doses
      const nbSlots = centre
        .appointment_schedules
        .filter(schedule => schedule.name === 'chronodose')
        .reduce((nb, schedule) => nb + schedule.total, 0);

      if (nbSlots < MIN_SLOTS) {
        return;
      }

      // don't tweet twice the same info
      const id = `${centre.url} - ${centre.prochain_rdv} - ${nbSlots}`
      if (alreadyTweeted.has(id)) {
        return;
      }
      alreadyTweeted.add(id);

      // On doctolib, double-check the slot is still available, bypassing the cache
      if (centre.plateforme === 'Doctolib') {
        const actualNbSlots = await getNumberOfAvailableSlots(centre.url);
        console.log(`${actualNbSlots} 1st dose slots found on doctolib.fr`);
        if (actualNbSlots === 0) {
          return;
        }
      }

      const calendarDate = dayjs(centre.prochain_rdv)
        .tz(TIMEZONE)
        .calendar(dayjs(),
          {
              sameDay: '[Aujourd\'hui à] H:mm',
              nextDay: '[Demain à] H:mm',
              sameElse: 'Le DD/MM/YYYY à H:mm',
          }
      );

      const intro = (nbSlots === 1) ?
        `💉 Un créneau disponible` :
        `💉 ${nbSlots} créneaux disponibles`;

      const message =
        `${intro}\n` +
        `🗓 ${calendarDate}\n` +
        `🏥 ${centre.nom} (${centre.vaccine_type})\n` +
        `▶ ${centre.url}\n` +
        `📍 ${centre.metadata.address}`
          .slice(0, 280); // max tweet length = 280

      console.log(message);

      // generate the map image before tweeting...
      console.log('generating the map...');
      const map = new StaticMaps({
        width: 600,
        height: 400
      });
      map.addMarker({
        coord: [centre.location.longitude, centre.location.latitude],
        img: 'marker.png',
        height: 40,
        width: 40,
      });
      await map.render(undefined, 11);

      // tweet
      console.log('uploading the media...');
      const mediaId = await twitterClient.v1.uploadMedia(await map.image.buffer(), { type: 'png' });
      console.log('tweeting...')
      await twitterClient.v1.tweet(message, { media_ids: mediaId });
    });
  await Promise.all(promises)
    .catch(err => console.error(err));
}

function addZero(department: number) {return (department < 10 ? `0${department}` : department)}

function checkDepartments(departments: number[]) {
  return Promise.all(
    departments
      .map(department => checkDepartment(department)),
  )
}

checkDepartments(DEPARTMENTS_TO_CHECK);
setInterval(() => checkDepartments(DEPARTMENTS_TO_CHECK), CHECK_INTERVAL_SEC * 1000)