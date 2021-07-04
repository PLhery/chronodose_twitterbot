# Chronodose Twitter bot

This repository hosts https://twitter.com/chronodoseparis source code

In May, only slots still available <24h in advance were available for 18-55 year olds.

This bot leveraged https://vitemadose.covidtracker.fr/ to find new available appointments in the "chronodose" section, and double-checked on doctolib their availability, trying to bypass their cache.

It was later used by many twitter accounts in other areas (@ChronodoseTLS @Chronodose54 @ChronodoseNord @Chronodose13 @Chronodose33 @Chronodose_35 @Chronodose5962 @chronodoseclf @Chronodose87 @chronodose29 @Chronodose44)


![image](https://user-images.githubusercontent.com/4018426/124389781-012ab980-dce9-11eb-86ea-63aa8744da84.png)


## Installation

Create a Twitter app on https://developer.twitter.com/en/apps , and create a Twitter account for your bot.

Tip: To generate Twitter account tokens for a Twitter app, you can use this script https://gist.github.com/PLhery/4c82273e351540be327908c44698b322

You can also run `npm run tw-login` after setting you APP_KEY and APP_SECRET in you .env, to directly generate it from your console.

### Using docker-compose

- download the [docker-compose.yml](docker-compose.yml) file

```bash
mkdir chronobot
cd chronobot
curl https://raw.githubusercontent.com/PLhery/chronodose_twitterbot/main/docker-compose.yml -o docker-compose.yml
```

- customize the ENVIRONMENT section in the file `vim docker-compose.yml`

- run `docker-compose up -d`
- To update the bot, run `docker-compose pull && docker-compose up -d`

### Using docker

```bash
docker run -d plhery/chronodose_twitter -e DEPARTMENTS_TO_CHECK=75,92,93,94 -e APP_KEY=XXXX -e APP_SECRET=XXXX -e ACCESS_TOKEN=XXXX -e ACCESS_SECRET=XXXX
```

### Using node / pm2

- clone the repository
- copy .env.example to .env
- fill the .env file with your Twitter credentials / tweak some options
- to start the bot, either use docker:

```bash
docker build . -t plhery/chronobot
docker run -d plhery/chronobot
```

- Or node 14 +:

```bash
npm install
npm run build
npm start
```

- To start in the background, for instance you can use pm2:

```bash
npm install -g pm2
pm2 start chronobot
```

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
