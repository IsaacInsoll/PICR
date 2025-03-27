import { Request } from 'express';
import { zipPath } from '../helpers/zip';
import { existsSync } from 'node:fs';
import { zipInProgress } from '../helpers/zipQueue';
import { dbFolderForId } from '../db/picrDb';

export const zipRequest = async (
  req: Request<{ folderId: string; hash: string }>,
  res,
) => {
  const { folderId, hash } = req.params;
  const folder = await dbFolderForId(folderId);
  if (!folder) res.sendStatus(404);
  const zPath = zipPath({ folder, hash });
  if (!existsSync(zPath)) {
    res.sendStatus(404);
  }
  if (zipInProgress({ folder, hash })) {
    res.sendStatus(400); // still zipping, can't send anything yet
  }
  res.sendFile(zPath);
};
