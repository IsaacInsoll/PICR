import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import UserModel from './UserModel';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { literal, Op } from 'sequelize';
import { AccessType } from '../../graphql-types';

@Table({ tableName: 'AccessLogs' })
export default class AccessLogModel extends Model {
  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;

  @ForeignKey(() => UserModel)
  @Column
  userId: number;

  @Column
  ipAddress: string;

  @Column
  sessionId: string;

  @Column
  userAgent: string;

  @Column({ type: DataType.ENUM(...Object.values(AccessType)) })
  declare type: AccessType;
}

export const createAccessLog = async (
  userId: number,
  folderId: number,
  context: IncomingCustomHeaders,
  type: AccessType,
) => {
  //Check if sessionId/ipAddress/user already accessed this in last hour and don't create if so

  const props = {
    userId: userId,
    folderId: folderId,
    type: type,
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

export const getAccessLogs = async (
  folderIds: number[],
  userId: number | number[],
) => {
  const data = await AccessLogModel.findAll({
    where: {
      folderId: { [Op.or]: folderIds },
      userId: !Array.isArray(userId) ? userId : { [Op.or]: userId },
    },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  return data;
};
