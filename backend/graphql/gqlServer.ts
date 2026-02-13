import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema.js';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders.js';
import { getUserFromToken } from '../auth/jwt-auth.js';
import { PicrRequestContext } from '../types/PicrRequestContext.js';
import { getUserFromUUID } from '../auth/getUserFromUUID.js';
import { dbFolderForId } from '../db/picrDb.js';
import { extraUserProps } from '../helpers/extraUserProps.js';
import { UserType } from '../../graphql-types.js';

export const gqlServer = createHandler({
  schema: schema,
  // @ts-expect-error graphq-http express typings don't match runtime request shape
  context: async (req): Promise<PicrRequestContext> => {
    const headers = req.headers as IncomingCustomHeaders;

    // `req.raw.ip` works fine unless we are behind a reverse proxy
    // @ts-expect-error req.raw exists at runtime in this server integration
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
    const extra = extraUserProps(
      user?.userType ? { userType: UserType[user?.userType] } : undefined,
    );

    return { headers: h, user, userHomeFolder, ...extra };
  },
});
