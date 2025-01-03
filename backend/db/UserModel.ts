import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import { CommentPermissions } from '../../graphql-types';

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
  declare commentPermissions: CommentPermissions; //dodgy JSON string of type `MetadataSummary.ts`

  // RELATIONSHIPS
  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;
}
