import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  HasMany,
  Table,
} from '@sequelize/core/decorators-legacy';
import Folder from './Folder';
import { CommentPermissions, FileType } from '../../graphql-types';

// Either a 'real user' with a hashedPassword or a 'public link' user with a UUID

@Table
export default class User extends Model {
  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.BOOLEAN)
  declare enabled: boolean;

  // IF REAL USER
  @Attribute(DataTypes.STRING)
  declare hashedPassword: string;
  @Attribute(DataTypes.STRING)
  declare username: string; //email address, also used to log in

  // IF PUBLIC LINK
  @Attribute(DataTypes.STRING)
  declare uuid: string; //public hash

  @Attribute(DataTypes.ENUM(...Object.values(CommentPermissions)))
  declare commentPermissions: CommentPermissions; //dodgy JSON string of type `MetadataSummary.ts`

  // RELATIONSHIPS
  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  folderId: number;
}
