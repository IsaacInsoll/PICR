import ServerOptions from '../models/ServerOptions';
import { lt, valid } from 'semver';
import { DataType, Sequelize } from 'sequelize-typescript';
import File from './../models/File';

export const dbMigrate = async (config, sequelize: Sequelize) => {
  const [opts, created] = await ServerOptions.findOrBuild({ where: { id: 1 } });

  const q = sequelize.getQueryInterface();

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.5')) {
      // config.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');
      // console.log(await q.describeTable('File'));
      // q.addColumn('File', 'flag', {
      //   type: DataType.ENUM(...Object.values(FileFlag)),
      // });

      await File.update(
        { totalComments: 0 },
        { where: { totalComments: null } },
      );
    }
  }
  opts.lastBootedVersion = config.version;
  await opts.save();
};
