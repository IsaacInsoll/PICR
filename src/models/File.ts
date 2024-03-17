import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
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
  declare metadata: string; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.FLOAT })
  declare imageRatio: number; // width / height (used for sizing on screen elements before image is loaded

  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
