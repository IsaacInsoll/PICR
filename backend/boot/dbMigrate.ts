import { lt, valid } from 'semver';
import { getServerOptions, setServerOptions } from '../db/picrDb';

// This does the "picr" side of migrations, for the DB side see schemaMigration.ts
export const dbMigrate = async (config) => {
  const opts = await getServerOptions();

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.5')) {
      // config.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');
    }
  }

  await setServerOptions({ lastBootedVersion: config.version });
};
