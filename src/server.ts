import express, { Request } from 'express';
import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { gqlserver } from './graphql/gqlserver';
import { logger } from './logger';
import { randomBytes } from 'node:crypto';
import path from 'path';
import User from './models/User';
import File from './models/File';
import { hashPassword } from './helpers/hashPassword';
import { fullPathFor } from './helpers/thumbnailGenerator';
import { AllSize, allSizes } from '../frontend/src/helpers/thumbnailSize';
import { Sequelize } from 'sequelize-typescript';
import pg from 'pg';

config(); // read .ENV
export const picrConfig = {
  tokenSecret: process.env.TOKEN_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  debugSql: process.env.DEBUG_SQL == 'true',
  verbose: process.env.VERBOSE == 'true',
  usePolling: process.env.USE_POLLING == 'true',
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) ?? 20,
  dev: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
};
if (picrConfig.dev) {
  console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  console.log(picrConfig);
}

const envPassword = async () => {
  const totalUsers = await User.count();
  if (totalUsers == 0) {
    User.create({
      username: 'admin',
      hashedPassword: hashPassword('picr1234'),
    }).then(() =>
      console.log(
        '🔐 No users found so "admin" user created with password "picr1234"',
      ),
    );
  }
};

const envSecret = async () => {
  if (!picrConfig.tokenSecret) {
    const secret = randomBytes(64).toString('hex');
    console.log(`ERROR: You haven't specified a TOKEN_SECRET in .ENV
Heres one we just created for you:
TOKEN_SECRET=${secret}`);
    process.exit();
  }
};

const server = async () => {
  const sequelize = new Sequelize(picrConfig.databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: picrConfig.debugSql,
    models: [__dirname + '/models'],
  });

  await envSecret();
  try {
    await sequelize.sync({}); // build DB
  } catch (e) {
    console.error(
      '⚠️ Unable to connect to database. \n   Please ensure configuration is correct and database server is running',
    );
    // console.error(e);
    process.exit();
  }

  await envPassword();

  const e = express();
  const port = 6900;
  const appName = pkg.name;

  e.all('/graphql', gqlserver);
  e.use(express.static('public'));

  e.get(
    '/image/:id/:size/:hash/:filename', //filename is ignored but nice for users to see a 'nice' name
    async (req: Request<{ id: string; size: AllSize; hash: string }>, res) => {
      const { id, size, hash } = req.params;
      const file = await File.findOne({ where: { id, fileHash: hash } });
      if (!file) res.sendStatus(404);
      if (!allSizes.includes(size)) res.sendStatus(400);
      res.sendFile(fullPathFor(file, size));
    },
  );

  e.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  e.listen(port, () => {
    logger(`🌐 App listening at http://localhost:${port}`, true);
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
