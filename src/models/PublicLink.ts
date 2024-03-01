import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Folder from './Folder';

@Table
export default class PublicLink extends Model {
  @Column
  declare name: string;
  @Column
  declare uuid: string; //public hash
  @Column
  declare availableFrom?: Date;
  @Column
  declare availableTo?: Date;
  // @Column
  // declare enabled: boolean;

  @ForeignKey(() => Folder)
  @Column
  folderId: number;
}
