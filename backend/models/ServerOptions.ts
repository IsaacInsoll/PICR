import { Column, Model, Table } from 'sequelize-typescript';

@Table
export default class ServerOptions extends Model {
  @Column
  declare lastBootedVersion: string; //in case we need to do a data migration
}
