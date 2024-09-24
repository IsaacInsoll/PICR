import { picrConfig } from '../server';
import ServerOptions from '../models/ServerOptions';
import { lt, valid } from 'semver';
import { DataType, Sequelize } from 'sequelize-typescript';
import { FileFlag } from '../../graphql-types';

export const dbMigrate = async (sequelize: Sequelize) => {
  const [opts, created] = await ServerOptions.findOrBuild({ where: { id: 1 } });

  const q = sequelize.getQueryInterface();

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.5')) {
      // picrConfig.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');
      // console.log(await q.describeTable('File'));
      // q.addColumn('File', 'flag', {
      //   type: DataType.ENUM(...Object.values(FileFlag)),
      // });
    }
  }
  opts.lastBootedVersion = picrConfig.version;
  await opts.save();
};
