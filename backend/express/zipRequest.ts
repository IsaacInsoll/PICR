import type { Request, Response } from 'express';
import { zipPath } from '../helpers/zip.js';
import { existsSync } from 'node:fs';
import { zipInProgress } from '../helpers/zipQueue.js';
import { dbFolderForId } from '../db/picrDb.js';
import { log } from '../logger.js';

export const zipRequest = async (
  req: Request<{ folderId: number; hash: string; filename: string }>,
  res: Response,
) => {
  const { folderId, hash } = req.params;
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    res.set('Cache-Control', 'no-store');
    res.sendStatus(400);
    return;
  }
  const folder = await dbFolderForId(folderId);
  if (!folder) {
    res.sendStatus(404);
    return;
  }
  const zPath = zipPath({ folder, hash });
  if (zipInProgress({ folder, hash })) {
    res.set('Cache-Control', 'no-store');
    res.set('Retry-After', '2');
    res.sendStatus(503);
    return;
  }
  if (!existsSync(zPath)) {
    res.set('Cache-Control', 'no-store');
    res.sendStatus(404);
    return;
  }
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(zPath, (error?: Error) => {
    if (!error) return;
    log(
      'error',
      `ZIP download failed for folder ${folderId} (${hash}): ${String(error)}`,
    );
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.removeHeader('Cache-Control');
    res.set('Cache-Control', 'no-store');
    res.sendStatus(500);
  });
};
