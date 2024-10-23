import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import User from './User';

@Table
export default class AccessLog extends Model {
  @ForeignKey(() => Folder)
  @Column(DataType.INTEGER)
  folderId: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;
}
