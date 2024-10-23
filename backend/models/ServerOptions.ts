import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export default class ServerOptions extends Model {
  @Column(DataType.TEXT)
  declare lastBootedVersion: string; //in case we need to do a data migration
}
