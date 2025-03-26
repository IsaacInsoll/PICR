import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import { PrimaryColor, ThemeMode } from '../../graphql-types';

@Table({ tableName: 'Brandings' })
export default class BrandingModel extends Model {
  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;
  //
  @Column({ type: DataType.ENUM(...Object.values(ThemeMode)) })
  declare mode: ThemeMode;

  @Column({ type: DataType.ENUM(...Object.values(PrimaryColor)) })
  declare primaryColor: PrimaryColor;

  @Column
  declare logoUrl: string;
}

export const brandingForFolderId = async (folderId: number) => {
  return await BrandingModel.findOne({ where: { folderId: folderId } });
};
