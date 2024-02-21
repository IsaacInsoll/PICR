import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Folder } from './folder';

@Table
export class File extends Model {
  @Column
  declare name: string;
  @Column
  declare fileHash: string;
  @Column
  declare relativePath: string;

  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
