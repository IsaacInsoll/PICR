import express from 'express';
import { gqlServer } from '../graphql/gqlServer.js';
import { imageRequest } from './imageRequest.js';
import { zipRequest } from './zipRequest.js';
import { picrTemplate } from './picrTemplate.js';
import { getBasePrefix } from './basePath.js';
import { resolvePublicDir } from './resolvePublicDir.js';
import { drainOnViewScanRequests } from '../filesystem/onViewScan.js';
import { createReadyz, healthz } from './health.js';
import { registerMediaChangedRoute } from './mediaChanged.js';

export const expressServer = () => {
  const exp = express();
  exp.set('trust proxy', 1);
  const router = express.Router();
  const readyz = createReadyz();

  const publicDir = resolvePublicDir();
  // Registered on both `exp` (unprefixed) and `router` (under BASE_URL's prefix)
  // on purpose: the Docker HEALTHCHECK hits bare /readyz, so it must stay
  // reachable even when a base path is configured. Don't "dedupe" these.
  exp.get('/healthz', healthz);
  exp.get('/readyz', readyz);
  router.get('/healthz', healthz);
  router.get('/readyz', readyz);
  registerMediaChangedRoute(router);
  router.all('/graphql', (req, res, next) => {
    res.on('finish', () => drainOnViewScanRequests(req));
    return gqlServer(req, res, next);
  });
  router.use(express.static(publicDir, { index: false }));
  router.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  router.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name
  router.use('/api', (_req, res) =>
    res.status(404).json({ error: 'Not found' }),
  );
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
