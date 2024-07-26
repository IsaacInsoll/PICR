import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Folder from './Folder';

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
  declare username: string;

  // IF PUBLIC LINK
  @Column
  declare uuid: string; //public hash

  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
