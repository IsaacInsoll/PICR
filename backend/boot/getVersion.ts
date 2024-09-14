import { readFileSync } from 'node:fs';
import { logger } from '../logger';
import { picrConfig } from '../server';

export const getVersion = () => {
  try {
    picrConfig.version = readFileSync('dist/version.txt', 'utf8');
    logger(
      '#️⃣ Running version: ' +
        (picrConfig.dev ? '[DEV] ' : '') +
        picrConfig.version,
      true,
    );
  } catch (e) {
    // console.log(e);
  }
};
