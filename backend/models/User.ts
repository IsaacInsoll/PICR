import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import { CommentPermissions, FileType } from '../../graphql-types';

// Either a 'real user' with a hashedPassword or a 'public link' user with a UUID

@Table
export default class User extends Model {
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
  declare commentPermissions: CommentPermissions; //dodgy JSON string of type `MetadataSummary.ts`

  // RELATIONSHIPS
  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
