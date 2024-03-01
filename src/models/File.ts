import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Folder from './Folder';

@Table
export default class File extends Model {
  @Column
  declare name: string;
  @Column
  declare fileHash: string;
  @Column
  declare relativePath: string;

  @Column
  declare imageRatio: number; // width / height

  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
