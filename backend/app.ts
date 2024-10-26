import { configFromEnv } from './config/configFromEnv';
import { server } from './server';

configFromEnv();
server();
