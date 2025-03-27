import { lt, valid } from 'semver';
import { Sequelize } from 'sequelize-typescript';
import FileModel from '../db/sequelize/FileModel';
import AccessLogModel from '../db/sequelize/AccessLogModel';
import { AccessType, UserType } from '../../graphql-types';
import UserModel from '../db/sequelize/UserModel';
import { db, getServerOptions, setServerOptions } from '../db/picrDb';
import { dbServerOptions } from '../db/models';

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
        user.userType = user.uuid ? UserType.Link : UserType.Admin;
        await user.save();
      }
    }
  }

  await setServerOptions({ lastBootedVersion: config.version });
};
