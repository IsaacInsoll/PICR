import { Column, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'ServerOptions' })
export default class ServerOptionsModel extends Model {
  @Column
  declare lastBootedVersion: string; //in case we need to do a data migration
}

export const getServerOptions = async () => {
  const [opts] = await ServerOptionsModel.findOrBuild({
    where: { id: 1 },
  });
  return opts;
};
