import express from 'express';
import { gqlserver } from '../graphql/gqlserver';
import path from 'path';
import { log } from '../logger';
import { imageRequest } from './imageRequest';
import { zipRequest } from './zipRequest';

export const expressServer = () => {
  const exp = express();

  const port = 6900;

  exp.all('/graphql', gqlserver);
  exp.use(express.static('public'));
  exp.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  exp.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name

  //catch all other URLS and return the front end template
  exp.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../../public/index.html'));
  });

  exp.listen(port, () => {
    log(`🌐 App listening at http://localhost:${port}`, true);
  });

  return exp;
};
