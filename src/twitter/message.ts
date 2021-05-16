import emojiSet from '~/emojis';
import { CenterData } from '~/types/vite-ma-dose-api';
import twttr from 'twitter-text';

export function generateMessage(center: CenterData, intro: string, calendarDate: string): string {
    const message =
        `${intro}\n` +
        `${emojiSet.calendar} ${calendarDate}\n` +
        `${emojiSet.hospital} ${center.nom} (${center.vaccine_type})\n` +
        `${emojiSet.playButton} ${center.url}\n` +
        `${emojiSet.pin} ${center.metadata.address}`;
    return message;
}

export function generateValidTweet(message: string): string | null {
    let validTweet = null;
    const parsed = twttr.parseTweet(message);

    // Check if weightedLength is <280
    if (parsed.weightedLength > 279) {
        const trimmedMsg = message.substring(parsed.validRangeStart, parsed.validRangeEnd);
        console.log('🚀 ~ file: message.ts ~ line 23 ~ generateValidTweet ~ trimmedMsg', trimmedMsg);
        // testing if message is now valid
        if (twttr.parseTweet(trimmedMsg).valid) {
            validTweet = trimmedMsg;
        }
    } else {
        validTweet = message;
    }

    return validTweet;
}
