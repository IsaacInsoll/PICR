import express from 'express';
import { sequelize } from './database';
import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { gqlserver } from './gql';
import { logger } from './logger';

const app = async () => {
  config(); // read .ENV
  await sequelize.sync({}); // build DB

  const server = express();
  const port = 6900;
  const appName = pkg.name;

  server.all('/graphql', gqlserver);

  server.get('/', (req, res) => {
    res.send('Hello, World! 🌍');
  });

  server.listen(port, () => {
    logger(`🌐 App listening at http://localhost:${port}`);
  });

  //Close all the stuff
  process.on('exit', function () {
    sequelize.close().then(() => {
      console.log(`💀 ${appName} Closed`);
    });
  });

  // This is CTRL+C While it's running, trigger a nice shutdown
  process.on('SIGINT', function () {
    console.log(`❌ Shutting down ${appName}`);
    process.exit(0);
  });

  fileWatcher();
};

app();
