import { lt, valid } from 'semver';
import { Sequelize } from 'sequelize-typescript';
import FileModel from '../db/sequelize/FileModel';
import { getServerOptions, setServerOptions } from '../db/picrDb';

export const dbMigrate = async (config, sequelize: Sequelize) => {
  const opts = await getServerOptions();

  const q = sequelize.getQueryInterface();
  console.log('last booted', opts.lastBootedVersion);

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.5')) {
      // config.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');

      await FileModel.update(
        { totalComments: 0 },
        { where: { totalComments: null } },
      );
    }
  }

  await setServerOptions({ lastBootedVersion: config.version });
};
