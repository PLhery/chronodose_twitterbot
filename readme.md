# Chronodose twitter bot

This repository hosts https://twitter.com/chronodoseparis source code 

It leverages https://vitemadose.covidtracker.fr/ to find new available appointments in the "chronodose" section

## Installation

Create a twitter app, and fill .env with the twitter credentials.

You can also tweak some additional available options there.

Then you can
```bash
npm install
npm run build
npm start
```

To run in the background, for instance you can leverage pm2 or docker

```bash
docker build . -t plhery/chronobot

docker run -d plhery/chronobot
```

## License
[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)