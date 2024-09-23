import { readFileSync } from 'node:fs';
import { log } from '../logger';
import { picrConfig } from '../server';

export const getVersion = () => {
  try {
    picrConfig.version = readFileSync('dist/version.txt', 'utf8');
    log(
      'info',
      '#️⃣ Running version: ' +
        (picrConfig.dev ? '[DEV] ' : '') +
        picrConfig.version,
      true,
    );
  } catch (e) {
    // console.log(e);
  }
};
