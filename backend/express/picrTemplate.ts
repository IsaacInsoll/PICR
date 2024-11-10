import { readFileSync } from 'node:fs';
import { log } from '../logger';
import { contextPermissionsForFolder } from '../auth/contextPermissionsForFolder';
import Folder from '../models/Folder';
import { folderStatsSummaryText } from '../graphql/helpers/folderStats';
import { thumbnailForFolder } from '../helpers/thumbnailForFolder';
import { imageURL } from '../../frontend/src/helpers/imageURL';
import { Request, Response } from 'express';
import { joinTitles } from '../helpers/joinTitle';
import { heroImageForFolder } from '../graphql/helpers/heroImageForFolder';

interface ITemplateFields {
  title: string;
  description: string;
  image: string;
}

// Build basic template, mainly so there are metadata fields if sharing this link online so you get a 'rich link'
export const picrTemplate = async (req: Request, res: Response) => {
  let fields: ITemplateFields = fieldDefaults;

  // Replace metadata on public links
  const sub = req.path.split('/');
  if (sub[1] == 's' && sub.length >= 3) {
    const folderId = parseInt(sub[3]);
    if (!isNaN(folderId)) {
      const [perms, user] = await contextPermissionsForFolder(
        { uuid: sub[2], auth: '' },
        folderId,
      );
      if (perms != 'None') {
        const folder = await Folder.findByPk(folderId);
        const summary = await folderStatsSummaryText(folderId);
        const thumb = await heroImageForFolder(folder);
        fields = {
          ...fields,
          title: joinTitles([folder.name, fields.title]),
          description: summary,
          image: thumb ? imageURL(thumb, 'md') : fields.image,
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
};
