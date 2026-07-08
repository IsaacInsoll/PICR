import express from 'express';
import { gqlServer } from '../graphql/gqlServer.js';
import { imageRequest } from './imageRequest.js';
import { zipRequest } from './zipRequest.js';
import { picrTemplate } from './picrTemplate.js';
import { getBasePrefix } from './basePath.js';
import { resolvePublicDir } from './resolvePublicDir.js';
import { drainOnViewScanRequests } from '../filesystem/onViewScan.js';

export const expressServer = () => {
  const exp = express();
  exp.set('trust proxy', 1);
  const router = express.Router();

  const publicDir = resolvePublicDir();
  router.all('/graphql', (req, res, next) => {
    res.on('finish', () => drainOnViewScanRequests(req));
    return gqlServer(req, res, next);
  });
  router.use(express.static(publicDir, { index: false }));
  router.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  router.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name
  // exp.get('/debug',debug);
  //catch all other URLS and return the front end template
  router.use(picrTemplate);

  const basePrefix = getBasePrefix();
  if (basePrefix) {
    exp.use(basePrefix, router);
  } else {
    exp.use(router);
  }

  return exp;
};

// const debug=async (
//   req: Request,
//   res: Response) =>{
//   console.log(req.headers);
//   res.send(JSON.stringify(req.headers));
// };
