import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { getUserFromToken } from '../auth/jwt-auth';
import { PicrRequestContext } from '../types/PicrRequestContext';
import { getUserFromUUID } from '../auth/getUserFromUUID';
import { dbFolderForId } from '../db/picrDb';

export const gqlServer = createHandler({
  schema: schema,
  context: async (req, params): Promise<PicrRequestContext> => {
    const headers = req.headers as IncomingCustomHeaders;

    // `req.raw.ip` works fine unless we are behind a reverse proxy
    // @ts-ignore it has always been a string (not string[]) so far, so I'm not overcomplicating it... yet
    const ipAddress: string =
      headers['x-real-ip'] ?? headers['x-forwarded-for'] ?? req.raw.ip ?? '';

    const h = {
      auth: headers.authorization ?? '',
      uuid: headers.uuid,
      host: headers.host,
      sessionId: headers.sessionid as string, //note: header field is lower case
      userAgent: headers['user-agent'],
      ipAddress,
    };

    const user = (await getUserFromToken(h)) ?? (await getUserFromUUID(h));
    const userHomeFolder = await dbFolderForId(user?.folderId);

    return { headers: h, user, userHomeFolder };
  },
});
