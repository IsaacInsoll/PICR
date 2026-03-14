import { configFromEnv } from './config/configFromEnv.js';
import { server } from './server.js';

configFromEnv();
void server();
