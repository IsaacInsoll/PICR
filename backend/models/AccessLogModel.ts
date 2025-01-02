import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  Table,
} from '@sequelize/core/decorators-legacy';
import Folder from './Folder';
import User from './User';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { literal, Op } from '@sequelize/core';

@Table({ tableName: 'AccessLogs' })
export default class AccessLogModel extends Model {
  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  folderId: number;

  @ForeignKey(() => User)
  @Attribute(DataTypes.INTEGER)
  userId: number;

  @Attribute(DataTypes.STRING)
  ipAddress: string;

  @Attribute(DataTypes.STRING)
  sessionId: string;

  @Attribute(DataTypes.STRING)
  userAgent: string;
}

export const createAccessLog = async (
  userId: number,
  folderId: number,
  context: IncomingCustomHeaders,
) => {
  //Check if sessionId/ipAddress/user already accessed this in last hour and don't create if so

  const props = {
    userId: userId,
    folderId: folderId,
    ipAddress: context.ipAddress,
    sessionId: context.sessionId,
    userAgent: context.userAgent,
  };

  const recent = await AccessLogModel.findOne({
    where: {
      ...props,
      createdAt: {
        [Op.gte]: literal("NOW() - interval '3600' second"), //postgres
        // [Op.gte]: literal("DATETIME(CURRENT_TIMESTAMP,'-3600 second')"), //mysql
      },
    },
  });

  if (recent) return;

  const log = new AccessLogModel();
  log.set(props);
  await log.save();
};
