import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Folder } from './folder';

@Table
export class User extends Model {
  @Column
  declare username: string;
  @Column
  declare hashedPassword: string;
}
