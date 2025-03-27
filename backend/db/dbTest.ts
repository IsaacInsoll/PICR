import { getServerOptions } from './sequelize/ServerOptionsModel';

export const dbTest = async () => {
  return;
  console.log('\n\n🚧 Database Tests for Sequelize Migration\n\n');
  const old = await getServerOptions();
  const driz = await getServerOptions2();

  const json = old.toJSON();
  Object.keys(json).map((k) => {
    console.log([k, json[k], driz[k]]);
  });

  // console.log(['sequelize', old.toJSON()]);
  // console.log(['drizzle', driz]);
  console.log('\n\n🚧 Database Tests Complete\n\n');
};
