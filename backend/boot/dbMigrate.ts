import { picrConfig } from '../server';
import ServerOptions from '../models/ServerOptions';
import { lt, valid } from 'semver';
import { DataType, Sequelize } from 'sequelize-typescript';

export const dbMigrate = async (sequelize: Sequelize) => {
  const [opts, created] = await ServerOptions.findOrBuild({ where: { id: 1 } });
  //TODO: migrate data if required (IE: add new fields or mark things as 'needing more metadata fetched' or whatever)
  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.3')) {
      picrConfig.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.2 ▶️ 0.2.3');
      // this works!!!
      // sequelize
      //   .getQueryInterface()
      //   .addColumn('ServerOptions', 'yolo', { type: DataType.TEXT });
    }
  }
  opts.lastBootedVersion = picrConfig.version;
  await opts.save();
};
