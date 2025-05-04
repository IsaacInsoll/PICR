import { readFileSync } from 'node:fs';
import { contextPermissions } from '../auth/contextPermissions';
import { folderStatsSummaryText } from '../graphql/helpers/folderStats';
import { imageURL } from '../../frontend/src/helpers/imageURL';
import { Request, Response } from 'express';
import { joinTitles } from '../helpers/joinTitle';
import { heroImageForFolder } from '../graphql/helpers/heroImageForFolder';
import { MinimalFile } from '../../frontend/types';
import { dbFolderForId, FileFields } from '../db/picrDb';
import { getUserFromUUID } from '../auth/getUserFromUUID';
import { picrConfig } from '../config/picrConfig';

interface ITemplateFields {
  title: string;
  description: string;
  image: string;
  url: string;
}

// Build basic template, mainly so there are metadata fields if sharing this link online so you get a 'rich link'
export const picrTemplate = async (req: Request, res: Response) => {
  const strippedBase = picrConfig.baseUrl.slice(0, -1);
  let fields: ITemplateFields = {
    ...fieldDefaults,
    url: strippedBase + req.path,
  };
  //todo: remainder of url

  //FB messenger was adding `%E2%81%A9` to outgoing links so we need to strip that. - observed december 25th, 2024
  if (req.path.endsWith('%E2%81%A9')) {
    return res.redirect(req.path.replace('%E2%81%A9', ''));
  }

  // Replace metadata on public links
  const sub = req.path.split('/');
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
            ? strippedBase + imageURL(fileFieldsToMinimalFile(thumb), 'md')
            : fields.image,
        };
      }
    }
  }

  let html = readFileSync('public/index.html', 'utf8');
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
