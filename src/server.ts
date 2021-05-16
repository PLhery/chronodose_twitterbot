import express from 'express';
import { checkDepartments } from '~/chronobot';
const app = express();
const port = 3000;

const CHECK_INTERVAL_SEC = Number(process.env.CHECK_INTERVAL_SEC) || 60; // check every X seconds
const DEPARTMENTS_TO_CHECK = process.env.DEPARTMENTS_TO_CHECK!.split(',').map(Number);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    checkDepartments(DEPARTMENTS_TO_CHECK);
    setInterval(() => checkDepartments(DEPARTMENTS_TO_CHECK), CHECK_INTERVAL_SEC * 1000);
});
