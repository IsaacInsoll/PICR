import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  Table,
} from '@sequelize/core/decorators-legacy';
import Folder from './Folder';
import { PrimaryColor, ThemeMode } from '../../graphql-types';

@Table
export default class Branding extends Model {
  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  folderId: number;
  //
  @Attribute({ type: DataTypes.ENUM(...Object.values(ThemeMode)) })
  declare mode: ThemeMode;

  @Attribute({ type: DataTypes.ENUM(...Object.values(PrimaryColor)) })
  declare primaryColor: PrimaryColor;

  @Attribute(DataTypes.STRING)
  declare logoUrl: string;
}
