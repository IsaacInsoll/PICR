import { db } from './picrDb';

export const dbTest = async () => {
  return;
  console.log('\n\n🚧 Database Tests for Sequelize Migration\n\n');
  // const old = await brandingForFolderId(2);
  // const driz = await brandingForFolderId2(2);
  // compareKeys(old, driz);
  //
  // compareKeys(await brandingForFolderId(1), await brandingForFolderId2(1));

  // console.log(['sequelize', old.toJSON()]);
  // console.log(['drizzle', driz]);

  const list = await db.query.dbBranding.findMany();
  console.log(list);

  console.log('\n\n🚧 Database Tests Complete\n\n');
};

const compareKeys = (old: any, driz: any) => {
  const json = old.toJSON();
  Object.keys(json).map((k) => {
    console.log([k, json[k], driz[k]]);
  });
};
