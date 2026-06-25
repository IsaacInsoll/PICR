import { configFromEnv } from './config/configFromEnv.js';
import { checkFfmpeg } from './boot/checkFfmpeg.js';
import { detectVideoAcceleration } from './boot/detectVideoAcceleration.js';
import { server } from './server.js';

configFromEnv();
checkFfmpeg();
// Resolve VAAPI vs CPU before serving so ServerInfo/benchmark have the result.
// detectVideoAcceleration never rejects, so the server always starts.
void detectVideoAcceleration().then(() => server());
