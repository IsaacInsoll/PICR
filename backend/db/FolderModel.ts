import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import FileModel from './FileModel';

@Table({ tableName: 'Folders' })
export default class FolderModel extends Model {
  @Column
  declare name: string;
  @Column
  declare folderHash: string;
  @Column
  declare relativePath: string;
  @Column
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out folders deleted while server down

  @ForeignKey(() => FolderModel)
  @Column
  parentId: number;

  @HasMany(() => FolderModel)
  children: FolderModel[];

  @HasMany(() => FileModel)
  files: FileModel[];

  @ForeignKey(() => FileModel)
  @Column
  heroImageId: number;
}
