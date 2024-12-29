import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Folder from './Folder';
import User from './User';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { literal, Op } from 'sequelize';

@Table({ tableName: 'AccessLogs' })
export default class AccessLogModel extends Model {
  @ForeignKey(() => Folder)
  @Column
  folderId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  ipAddress: string;

  @Column
  sessionId: string;

  @Column
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
