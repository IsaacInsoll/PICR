import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import File from './File';

@Table
export default class Folder extends Model {
  @Column
  declare name: string;
  @Column
  declare folderHash: string;
  @Column
  declare relativePath: string;
  @Column
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out folders deleted while server down

  @ForeignKey(() => Folder)
  @Column
  parentId: number;

  @HasMany(() => Folder)
  children: Folder[];

  @HasMany(() => File)
  files: Folder[];
}
