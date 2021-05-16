# Chronodose Twitter bot

This repository hosts https://twitter.com/chronodoseparis source code

It leverages https://vitemadose.covidtracker.fr/ to find new available appointments in the "chronodose" section

## Installation

Create a Twitter app on https://developer.twitter.com/en/apps , and create a Twitter account for your bot.
To generate Twitter account tokens for a Twitter app, you can use the command `npm run login` or `yarn login` to directly have it in your console.

Then to set the tokens required, you need to copy the env example file :
`copy .env.example .env && vim .env` (you can use nano instead of vim)

## Build

The build files are converted from Typescript to JavaScript files in a folder `dist` that is created for you.
If there is any problem on this step, you can create the folder by yourself with `mkdir build` at the root level.

### Using docker-compose

- download the [docker-compose.yml](docker-compose.yml) file

```bash
mkdir chronobot
cd chronobot
curl https://raw.githubusercontent.com/PLhery/chronodose_twitterbot/main/docker-compose.yml -o docker-compose.yml
```

- customize the ENVIRONMENT section in the file `vim docker-compose.yml` (or nano)

- run `docker-compose up -d`
- To update the bot, run `docker-compose pull && docker-compose up -d`

### Using docker

```bash
docker run -d plhery/chronodose_twitter -e DEPARTMENTS_TO_CHECK=75,92,93,94 -e APP_KEY=XXXX -e APP_SECRET=XXXX -e ACCESS_TOKEN=XXXX -e ACCESS_SECRET=XXXX
```

### Using node / pm2

- clone the repository
- fill the .env file with your Twitter credentials / tweak some options
- either use docker to install and start the bot

```bash
docker build . -t plhery/chronobot
docker run -d plhery/chronobot
```

- Or use node 14 + npm to start the bot:

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
