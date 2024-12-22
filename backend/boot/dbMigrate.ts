import { valid } from 'semver';
import { serverOptionsTable } from '../db/models/serverOptionsTable';
import { db } from '../server';
import { IPicrConfiguration } from '../config/IPicrConfiguration';

export const dbMigrate = async (config: IPicrConfiguration) => {
  const opts = await db.select().from(serverOptionsTable);

  const options = opts[0];
  if (valid(options?.lastBootedVersion)) {
    // if (lt(opts.lastBootedVersion, '0.2.5')) {
    //   console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');
  }
  if (options) {
    await db
      .update(serverOptionsTable)
      .set({ lastBootedVersion: config.version });
  } else {
    await db
      .insert(serverOptionsTable)
      .values({ lastBootedVersion: config.version, updatedAt: new Date() });
  }
};
