import { Column, Model, Table } from 'sequelize-typescript';

@Table
export default class User extends Model {
  @Column
  declare username: string;
  @Column
  declare hashedPassword: string;
}
