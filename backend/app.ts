import { configFromEnv } from './config/configFromEnv.js';
import { checkFfmpeg } from './boot/checkFfmpeg.js';
import { checkOptionalMediaTools } from './boot/checkOptionalMediaTools.js';
import { detectVideoAcceleration } from './boot/detectVideoAcceleration.js';
import { server } from './server.js';
import { logFatalBanner } from './boot/startupBanner.js';
import { picrConfig } from './config/picrConfig.js';

let fatalErrorLogged = false;

const handleFatalError = (reason: unknown) => {
  if (fatalErrorLogged) return;
  fatalErrorLogged = true;
  logFatalBanner(
    picrConfig,
    reason instanceof Error ? (reason.stack ?? reason.message) : String(reason),
  );
  process.exit(1);
};

process.once('unhandledRejection', handleFatalError);
process.once('uncaughtException', handleFatalError);

configFromEnv();
checkFfmpeg();
checkOptionalMediaTools();
// Resolve VAAPI vs CPU before serving so ServerInfo/benchmark have the result.
void detectVideoAcceleration()
  .then(() => server())
  .catch(handleFatalError);
