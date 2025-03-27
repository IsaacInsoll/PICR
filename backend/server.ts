import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { setupRootFolder } from './filesystem/events/addFolder';
import { envPassword } from './boot/envPassword';
import { expressServer } from './express/express';
import { dbMigrate } from './boot/dbMigrate';
import { log } from './logger';
import { picrConfig } from './config/picrConfig';
import { initDb } from './db/picrDb';
import { schemaMigration } from './db/schemaMigration';

export const server = async () => {
  try {
    await schemaMigration();
    initDb();
    await dbMigrate(picrConfig);
  } catch (e) {
    console.error(
      `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
    );
    console.log(e);
    process.exit();
  }

  await setupRootFolder();
  await envPassword();
  const appName = pkg.name;
  const express = expressServer();
  express.listen(picrConfig.port, () => {
    log(
      'info',
      `🌐 App listening at http://localhost:${picrConfig.port}`,
      true,
    );
  });

  //Close all the stuff
  process.on('exit', function () {
    // sequelize.close().then(() => {
    console.log(`💀 ${appName} Closed`);
    // });
  });

  // This is CTRL+C While it's running, trigger a nice shutdown
  process.on('SIGINT', function () {
    console.log(`❌ Shutting down ${appName}`);
    process.exit(0);
  });

  await fileWatcher(picrConfig);
};
