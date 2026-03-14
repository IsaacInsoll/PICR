import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema.js';
import type { IncomingCustomHeaders } from '../types/incomingCustomHeaders.js';
import { getUserFromToken } from '../auth/jwt-auth.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';
import { getUserFromUUID } from '../auth/getUserFromUUID.js';
import { dbFolderForId } from '../db/picrDb.js';
import { extraUserProps } from '@shared/extraUserProps.js';
import { UserType } from '@shared/gql/graphql.js';

type GraphqlHttpContextRequest = {
  headers: IncomingCustomHeaders;
  raw?: { ip?: string };
};

const firstHeader = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const normalizedHeader = (value: string | undefined): string | undefined => {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const gqlServer = createHandler({
  schema: schema,
  context: async (req, params) => {
    void params;
    const request = req as GraphqlHttpContextRequest;
    const headers = request.headers;
    const forwarded = firstHeader(headers['x-forwarded-for']);
    const realIp = firstHeader(headers['x-real-ip']);

    // `req.raw.ip` works fine unless we are behind a reverse proxy
    const ipAddress = normalizedHeader(realIp ?? forwarded ?? request.raw?.ip);

    const h: PicrRequestContext['headers'] = {
      auth: normalizedHeader(firstHeader(headers.authorization)),
      uuid: headers.uuid,
      host: firstHeader(headers.host),
      sessionId: normalizedHeader(firstHeader(headers['sessionid'])), //note: header field is lower case
      userAgent: firstHeader(headers['user-agent']),
      ipAddress,
    };

    const user = (await getUserFromToken(h)) ?? (await getUserFromUUID(h));
    const userHomeFolder = await dbFolderForId(user?.folderId);
    const extra = extraUserProps(
      user?.userType ? { userType: UserType[user.userType] } : undefined,
    );

    return { headers: h, user, userHomeFolder, ...extra } as Record<
      string,
      unknown
    >;
  },
});
