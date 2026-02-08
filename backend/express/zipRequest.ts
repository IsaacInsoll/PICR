import { Request, Response } from 'express';
import { zipPath } from '../helpers/zip.js';
import { existsSync } from 'node:fs';
import { zipInProgress } from '../helpers/zipQueue.js';
import { dbFolderForId } from '../db/picrDb.js';

export const zipRequest = async (
  req: Request<{ folderId: number; hash: string; filename: string }>,
  res: Response,
) => {
  const { folderId, hash } = req.params;
  const folder = await dbFolderForId(folderId);
  if (!folder) {
    res.sendStatus(404);
    return;
  }
  const zPath = zipPath({ folder, hash });
  if (!existsSync(zPath)) {
    res.sendStatus(404);
    return;
  }
  if (zipInProgress({ folder, hash })) {
    res.sendStatus(400); // still zipping, can't send anything yet
    return;
  }
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(zPath);
};
