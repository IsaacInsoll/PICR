import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  HasMany,
  Table,
} from '@sequelize/core/decorators-legacy';

import File from './File';

@Table
export default class Folder extends Model {
  @Attribute(DataTypes.STRING)
  declare name: string;
  @Attribute(DataTypes.STRING)
  declare folderHash: string;
  @Attribute(DataTypes.STRING)
  declare relativePath: string;
  @Attribute(DataTypes.BOOLEAN)
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out folders deleted while server down

  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  parentId: number;

  @HasMany(() => Folder, 'parentId')
  children: Folder[];

  @HasMany(() => File, 'folderId')
  files: File[];

  @ForeignKey(() => File)
  @Attribute(DataTypes.INTEGER)
  heroImageId: number;
}
