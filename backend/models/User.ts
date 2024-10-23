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
  @Column(DataType.TEXT)
  declare name: string;

  @Column(DataType.BOOLEAN)
  declare enabled: boolean;

  // IF REAL USER
  @Column(DataType.TEXT)
  declare hashedPassword: string;
  @Column(DataType.TEXT)
  declare username: string;

  // IF PUBLIC LINK
  @Column(DataType.TEXT)
  declare uuid: string; //public hash

  @Column({ type: DataType.ENUM(...Object.values(CommentPermissions)) })
  declare commentPermissions: CommentPermissions; //dodgy JSON string of type `MetadataSummary.ts`

  // RELATIONSHIPS
  @ForeignKey(() => Folder)
  @Column(DataType.INTEGER)
  folderId: number;
}
