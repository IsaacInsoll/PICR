import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Folder from './Folder';
import User from './User';

@Table
export default class AccessLog extends Model {
  @ForeignKey(() => Folder)
  @Column
  folderId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;
}

export const createAccessLog = (userId: number, folderId: number) => {
  const log = new AccessLog();
  log.userId = userId;
  log.folderId = folderId;
  log.save();
};
