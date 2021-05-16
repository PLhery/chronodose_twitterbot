import emojiSet from '~/emojis';
import { CenterData } from '~/types/viteMaDoseApi';
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
    console.log('🚀 ~ file: chronobot.ts ~ line 61 ~ generateValidTweet ~ parsed', parsed);

    // Check if weightedLength is <280
    if (parsed.weightedLength > 279) {
        const trimmedMsg = message.substring(parsed.validRangeStart, parsed.validRangeEnd);
        // testing if message is now valid
        if (twttr.parseTweet(trimmedMsg).valid) {
            validTweet = trimmedMsg;
        }
    }

    return validTweet;
}