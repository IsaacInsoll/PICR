import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import PublicLink from './PublicLink';

@Table
export default class User extends Model {
  @Column
  declare username: string;
  @Column
  declare hashedPassword: string;

  // @BelongsTo(() => PublicLink)
  @ForeignKey(() => PublicLink)
  publicLink: PublicLink;
}
