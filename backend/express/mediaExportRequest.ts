import type { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import {
  mediaExportPath,
  validMediaExportToken,
} from '../mediaResults/mediaTextExport.js';

const safeDownloadName = (value: string) =>
  value.replace(/[^\p{L}\p{N}_.-]+/gu, '_') || 'export.txt';

export const mediaExportRequest = (
  req: Request<{ folderId: string; token: string; filename: string }>,
  res: Response,
) => {
  const folderId = Number(req.params.folderId);
  const { token } = req.params;
  if (
    !Number.isInteger(folderId) ||
    folderId < 1 ||
    !validMediaExportToken(token)
  ) {
    res.sendStatus(404);
    return;
  }
  const outputPath = mediaExportPath(folderId, token);
  if (!outputPath || !existsSync(outputPath)) {
    res.sendStatus(404);
    return;
  }
  res.set('Cache-Control', 'private, max-age=31536000, immutable');
  res.download(outputPath, safeDownloadName(req.params.filename));
};
