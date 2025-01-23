import { getServerOptions } from '../db/ServerOptionsModel';
import { lt, valid } from 'semver';
import { Sequelize } from 'sequelize-typescript';
import FileModel from '../db/FileModel';
import AccessLogModel from '../db/AccessLogModel';
import { AccessType } from '../../graphql-types';
import UserModel from '../db/UserModel';

export const dbMigrate = async (config, sequelize: Sequelize) => {
  const opts = await getServerOptions();

  const q = sequelize.getQueryInterface();
  console.log('last booted', opts.lastBootedVersion);

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion, '0.2.5')) {
      // config.updateMetadata = true;
      console.log('🖲️ Migrating 0.2.4 ▶️ 0.2.5');
      // console.log(await q.describeTable('File'));
      // q.addColumn('File', 'flag', {
      //   type: DataType.ENUM(...Object.values(FileFlag)),
      // });

      await FileModel.update(
        { totalComments: 0 },
        { where: { totalComments: null } },
      );
    }
    if (lt(opts.lastBootedVersion, '0.5.6')) {
      console.log('🖲️ Migrating 0.5.5 ▶️ 0.5.6');
      AccessLogModel.update(
        { type: AccessType.View },
        { where: { type: null } },
      );
    }
    if (lt(opts.lastBootedVersion, '0.5.8')) {
      console.log('🖲️ Migrating 0.5.7 ▶️ 0.5.8');
      const users = await UserModel.findAll();
      for (const user of users) {
        const lastAccess = await AccessLogModel.findOne({
          where: { userId: user.id },
          order: [['createdAt', 'DESC']],
        });
        if (lastAccess) {
          user.lastAccess = lastAccess.createdAt;
        }
        user.userType = user.uuid ? 'Link' : 'Admin';
        await user.save();
      }
    }
  }
  opts.lastBootedVersion = config.version;
  await opts.save();
};
