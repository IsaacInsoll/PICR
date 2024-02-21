import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import { File } from './file';

@Table
export class Folder extends Model {
  @Column
  declare name: string;
  @Column
  declare folderHash: string;
  @Column
  declare relativePath: string;

  @ForeignKey(() => Folder)
  @Column
  parentId: number;

  @HasMany(() => Folder)
  children: Folder[];

  @HasMany(() => File)
  files: Folder[];
}
