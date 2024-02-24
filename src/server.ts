import express from 'express';
import { sequelize } from './database';
import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { gqlserver } from './gql';
import { logger } from './logger';
import { randomBytes } from 'node:crypto';
import { generateAccessToken } from './auth/auth';

const server = async () => {
  config(); // read .ENV
  const secret = randomBytes(64).toString('hex');
  if (!process.env.TOKEN_SECRET) {
    console.log(`ERROR: You haven't specified a TOKEN_SECRET in .ENV
Heres one we just created for you:
TOKEN_SECRET=${secret}`);
    process.exit();
  }

  await sequelize.sync({}); // build DB

  const e = express();
  const port = 6900;
  const appName = pkg.name;

  e.all('/graphql', gqlserver);

  e.post('/auth', (req, res) => {
    const user = 'root'; // TODO: separate users
    const password = req.body.password;
    if (password != 'password') res.sendStatus(401);
    const token = generateAccessToken({ username: user });
    res.json(token);
  });

  e.use(express.static('public'));

  e.listen(port, () => {
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

server();
