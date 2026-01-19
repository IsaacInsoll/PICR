import { readFileSync } from 'node:fs';
import { contextPermissions } from '../auth/contextPermissions.js';
import { folderStatsSummaryText } from '../graphql/helpers/folderStats.js';
import { Request, Response } from 'express';
import { joinTitles } from '../helpers/joinTitle.js';
import { heroImageForFolder } from '../graphql/helpers/heroImageForFolder.js';
import { MinimalFile } from '../../frontend/types.js';
import { dbFolderForId, FileFields } from '../db/picrDb.js';
import { getUserFromUUID } from '../auth/getUserFromUUID.js';
import { picrConfig } from '../config/picrConfig.js';
import { resolvePublicDir } from './resolvePublicDir.js';
import { getBasePrefix, stripBasePrefix } from './basePath.js';

interface ITemplateFields {
  title: string;
  description: string;
  image: string;
  url: string;
  base: string;
}

// Build basic template, mainly so there are metadata fields if sharing this link online so you get a 'rich link'
export const picrTemplate = async (req: Request, res: Response) => {
  const strippedBase = picrConfig.baseUrl.slice(0, -1);
  const basePrefix = getBasePrefix();
  const requestPath = stripBasePrefix(req.originalUrl);
  let fields: ITemplateFields = {
    ...fieldDefaults,
    url: strippedBase + requestPath,
    base: picrConfig.baseUrlPathname,
  };

  //FB messenger was adding `%E2%81%A9` to outgoing links so we need to strip that. - observed december 25th, 2024
  if (requestPath.endsWith('%E2%81%A9')) {
    return res.redirect(basePrefix + requestPath.replace('%E2%81%A9', ''));
  }

  // Replace metadata on public links
  const sub = requestPath.split('/');
  if (sub[1] == 's' && sub.length >= 3) {
    const folderId = parseInt(sub[3]);
    if (!isNaN(folderId)) {
      // the following two lines are copy-pasta'd from gqlServer.ts, consider refactoring or less dodgy hacks here
      const user = await getUserFromUUID({ uuid: sub[2], auth: '' });
      const userHomeFolder = await dbFolderForId(user?.folderId);

      const { permissions, folder } = await contextPermissions(
        { user, userHomeFolder, headers: {} },
        folderId,
      );
      if (permissions != 'None' && folder) {
        const summary = await folderStatsSummaryText(folderId);
        const thumb = await heroImageForFolder(folder);
        fields = {
          ...fields,
          title: joinTitles([folder.name, fields.title]),
          description: summary,
          image: thumb
            ? strippedBase + imagePathFor(fileFieldsToMinimalFile(thumb), 'md')
            : fields.image,
        };
      }
    }
  }

  const publicDir = resolvePublicDir();
  let html = readFileSync(publicDir + '/index.html', 'utf8');
  Object.entries(fields).forEach(([key, value]) => {
    html = html.replaceAll(`{${key}}`, value);
  });
  res.send(html);
};

const fieldDefaults: ITemplateFields = {
  title: 'PICR',
  description: 'PICR File Sharing',
  image: '',
  url: '',
  base: '/',
};

const fileFieldsToMinimalFile = (
  f: FileFields,
): Pick<MinimalFile, 'id' | 'fileHash' | 'name' | 'type'> => {
  return {
    id: f.id.toString(),
    fileHash: f.fileHash ?? undefined,
    name: f.name,
    // @ts-ignore
    type: f.type,
  };
};

const imagePathFor = (
  file: Pick<MinimalFile, 'id' | 'fileHash' | 'name' | 'type'>,
  size: 'raw' | 'sm' | 'md' | 'lg',
) => {
  const path = `/image/${file.id}/${size}/${file.fileHash}/`;
  if (file.type == 'Video' && size != 'raw') return path + 'joined.jpg';
  return path + file.name;
};
