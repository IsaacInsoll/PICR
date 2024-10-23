import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import File from './File';

@Table
export default class Folder extends Model {
  @Column(DataType.TEXT)
  declare name: string;
  @Column(DataType.TEXT)
  declare folderHash: string;
  @Column(DataType.TEXT)
  declare relativePath: string;
  @Column(DataType.BOOLEAN)
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out folders deleted while server down

  @ForeignKey(() => Folder)
  @Column(DataType.INTEGER)
  parentId: number;

  @HasMany(() => Folder)
  children: Folder[];

  @HasMany(() => File)
  files: Folder[];
}
