import { configFromEnv } from './config/configFromEnv.js';
import { checkFfmpeg } from './boot/checkFfmpeg.js';
import { server } from './server.js';

configFromEnv();
checkFfmpeg();
void server();
