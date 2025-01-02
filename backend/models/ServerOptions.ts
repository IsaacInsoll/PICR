import { DataTypes, Model } from '@sequelize/core';
import { Attribute, Table } from '@sequelize/core/decorators-legacy';

@Table
export default class ServerOptions extends Model {
  @Attribute(DataTypes.STRING)
  declare lastBootedVersion: string; //in case we need to do a data migration
}
