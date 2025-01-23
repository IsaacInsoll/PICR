import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import { CommentPermissions, UserType } from '../../graphql-types';
import { sep } from 'path';
import { userTypeEnum } from '../graphql/enums/userTypeEnum';

// Either a 'real user' with a hashedPassword or a 'public link' user with a UUID

@Table({ tableName: 'Users' })
export default class UserModel extends Model {
  @Column
  declare name: string;

  @Column
  declare enabled: boolean;

  // IF REAL USER
  @Column
  declare hashedPassword: string;
  @Column
  declare username: string; //email address, also used to log in

  // IF PUBLIC LINK
  @Column
  declare uuid: string; //public hash

  @Column({ type: DataType.ENUM(...Object.values(CommentPermissions)) })
  declare commentPermissions: CommentPermissions;

  @Column({ type: DataType.ENUM(...Object.values(UserType)) })
  declare userType: UserType;

  @Column
  declare lastAccess: Date;

  // RELATIONSHIPS
  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;

  updateLastAccess() {
    this.lastAccess = new Date();
    this.save();
  }
}
