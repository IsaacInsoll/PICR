import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import { PrimaryColor, ThemeMode } from '../../graphql-types';

@Table
export default class Branding extends Model {
  @ForeignKey(() => Folder)
  @Column
  folderId: number;
  //
  @Column({ type: DataType.ENUM(...Object.values(ThemeMode)) })
  declare mode: ThemeMode;

  @Column({ type: DataType.ENUM(...Object.values(PrimaryColor)) })
  declare primaryColor: PrimaryColor;

  //
  // @Column({ type: DataType.TEXT })
  // declare comment: string;
  //
}
