import { readFileSync } from 'node:fs';
import { contextPermissions } from '../auth/contextPermissions.js';
import { folderStatsSummaryText } from '../graphql/helpers/folderStats.js';
import type { Request, Response } from 'express';
import { joinTitles } from '@shared/joinTitle.js';
import { heroImageForFolder } from '../graphql/helpers/heroImageForFolder.js';
import type { FileFields } from '../db/picrDb.js';
import { picrConfig } from '../config/picrConfig.js';
import { resolvePublicDir } from './resolvePublicDir.js';
import { getBasePrefix, stripBasePrefix } from './basePath.js';
import { resolvePublicLinkAttempt } from '../auth/publicLinkAttempt.js';
import {
  principalUser,
  requestAuthentication,
} from '../types/RequestAuthentication.js';
import { getServerMediaSettings } from '../media/serverMediaSettings.js';
import { thumbnailVariantForWidth } from '@shared/thumbnailVariants.js';
import type {
  ThumbnailVariantToken,
  ThumbnailVariantWidth,
} from '@shared/thumbnailVariants.js';

let cachedIndexHtml: string | undefined;

interface ITemplateFields {
  title: string;
  description: string;
  image: string;
  url: string;
  base: string;
  favicon: string;
}

type TemplateMediaFile = {
  id: string;
  fileHash?: string;
  name: string;
  type: 'File' | 'Image' | 'Video';
};

// Build basic template, mainly so there are metadata fields if sharing this link online so you get a 'rich link'
export const picrTemplate = async (req: Request, res: Response) => {
  const strippedBase = picrConfig.baseUrl.slice(0, -1);
  const basePrefix = getBasePrefix();
  const requestPath = stripBasePrefix(req.originalUrl);
  let fields: ITemplateFields = {
    ...fieldDefaults,
    url: strippedBase + requestPath,
    base: picrConfig.baseUrlPathname,
    // Dev/staging servers (NODE_ENV=development) get the beta logo favicon so
    // they're distinguishable from a production instance at a glance.
    favicon: picrConfig.dev ? 'favicon-beta.png' : 'favicon.ico',
  };

  //FB messenger was adding `%E2%81%A9` to outgoing links so we need to strip that. - observed december 25th, 2024
  if (requestPath.endsWith('%E2%81%A9')) {
    return res.redirect(basePrefix + requestPath.replace('%E2%81%A9', ''));
  }

  // Replace metadata on public links
  const sub = requestPath.split('/');
  if (sub[1] === 's' && sub.length >= 3) {
    const publicLinkAttempt = await resolvePublicLinkAttempt(
      sub[2] ?? '',
      undefined,
      new Date(),
    );
    const authentication = requestAuthentication(undefined, publicLinkAttempt);
    const user = principalUser(authentication);
    const userHomeFolder = publicLinkAttempt.homeFolder;

    // Shared links are bare `/s/<uuid>`; the folder segment only appears after
    // the client navigates. Fall back to the link's home folder so the link a
    // photographer actually pastes into a message still gets a rich preview.
    // Read that fallback off the principal, not `publicLinkAttempt.homeFolder`:
    // the attempt keeps a home folder for expired links so the gate can show
    // branding, whereas `principalUser` is only set once the link actually
    // authenticated. Expired, disabled, and passcode-gated links therefore fall
    // through to generic metadata here.
    const pathFolderId = parseInt(sub[3], 10);
    const folderId = isNaN(pathFolderId) ? user?.folderId : pathFolderId;
    if (folderId) {
      const { permissions, folder } = await contextPermissions(
        { authentication, user, userHomeFolder, headers: {} },
        folderId,
      );
      if (permissions !== 'None' && folder) {
        const summary = await folderStatsSummaryText(folderId);
        const thumb = await heroImageForFolder(folder);
        fields = {
          ...fields,
          title: joinTitles([folder.name, fields.title]),
          description: summary,
          image: thumb
            ? strippedBase +
              (await imagePathForVariant(fileFieldsToTemplateFile(thumb), 500))
            : fields.image,
        };
      }
    }
  }

  if (!cachedIndexHtml) {
    const publicDir = resolvePublicDir();
    cachedIndexHtml = readFileSync(publicDir + '/index.html', 'utf8');
  }
  let html = cachedIndexHtml;
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
  favicon: 'favicon.ico',
};

const fileFieldsToTemplateFile = (f: FileFields): TemplateMediaFile => {
  return {
    id: f.id.toString(),
    fileHash: f.fileHash ?? undefined,
    name: f.name,
    type: f.type as TemplateMediaFile['type'],
  };
};

const imagePathFor = (
  file: TemplateMediaFile,
  token: ThumbnailVariantToken,
) => {
  const path = `/image/${file.id}/${token}/${file.fileHash}/`;
  // The filename segment is decorative; the token picks the cache entry.
  if (file.type === 'Video') return path + 'poster.jpg';
  return path + encodeURIComponent(file.name);
};

const imagePathForVariant = async (
  file: TemplateMediaFile,
  width: ThumbnailVariantWidth,
): Promise<string> => {
  const settings = await getServerMediaSettings();
  const variant = thumbnailVariantForWidth(
    width,
    settings.thumbnailJpegQuality,
  );
  return imagePathFor(file, variant.token);
};
