import {
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

@Table
export class Folder extends Model {
  @Column
  declare name: string;
  @Column
  declare folderHash: string;
  @Column
  declare fullPath: string;

  @ForeignKey(() => Folder)
  @Column
  parentId: number;

  @HasMany(() => Folder)
  children: Folder[];
}
