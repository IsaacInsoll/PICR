import { Request } from 'express';
import { zipPath } from "../helpers/zip.js";
import { existsSync } from 'node:fs';
import { zipInProgress } from "../helpers/zipQueue.js";
import { dbFolderForId } from "../db/picrDb.js";

export const zipRequest = async (
  req: Request<{ folderId: number; hash: string }>,
  res,
) => {
  const { folderId, hash } = req.params;
  const folder = await dbFolderForId(folderId);
  if (!folder) return res.sendStatus(404);
  const zPath = zipPath({ folder, hash });
  if (!existsSync(zPath)) {
    res.sendStatus(404);
  }
  if (zipInProgress({ folder, hash })) {
    res.sendStatus(400); // still zipping, can't send anything yet
  }
  res.sendFile(zPath);
};
