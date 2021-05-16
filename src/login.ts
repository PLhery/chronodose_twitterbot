import { TwitterApi } from 'twitter-api-v2';
import rl from 'readline';

// Dotenv
import dotenv from 'dotenv';
dotenv.config();

const APP_INFOS = {
    appKey: process.env.APP_KEY!,
    appSecret: process.env.APP_SECRET!,
};

const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
});

(async () => {
    const { url, oauth_token, oauth_token_secret } = await new TwitterApi(APP_INFOS).generateAuthLink();

    console.log('log in to ' + url);

    const code = (await new Promise((resolve) => readline.question('Enter your code', resolve))) as string;

    const client = new TwitterApi({ ...APP_INFOS, accessToken: oauth_token, accessSecret: oauth_token_secret });
    const infos = await client.login(code);
    console.log(infos);
})().catch((e) => console.error('error', e.data));
