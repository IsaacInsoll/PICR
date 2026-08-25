import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema.js';
import type { IncomingCustomHeaders } from '../types/incomingCustomHeaders.js';
import { getUserFromToken } from '../auth/jwt-auth.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';
import { dbFolderForId } from '../db/picrDb.js';
import { extraUserProps } from '@shared/extraUserProps.js';
import { UserType } from '@shared/gql/graphql.js';
import { galleryPasscodeHeader } from '@shared/auth/galleryPasscode.js';
import { visibilityHeader } from '@shared/realVisit.js';
import type { IncomingMessage } from 'node:http';
import { createOnViewScanSet } from '../filesystem/onViewScan.js';
import { resolvePublicLinkAttempt } from '../auth/publicLinkAttempt.js';
import {
  principalUser,
  requestAuthentication,
  type PublicLinkAttempt,
} from '../types/RequestAuthentication.js';

type GraphqlHttpContextRequest = {
  headers: IncomingCustomHeaders;
  raw?: IncomingMessage & { ip?: string };
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
      uuid: normalizedHeader(firstHeader(headers.uuid)),
      galleryPasscode: normalizedHeader(
        firstHeader(headers[galleryPasscodeHeader]),
      ),
      host: firstHeader(headers.host),
      sessionId: normalizedHeader(firstHeader(headers['sessionid'])), //note: header field is lower case
      userAgent: firstHeader(headers['user-agent']),
      ipAddress,
      visibility: normalizedHeader(firstHeader(headers[visibilityHeader])),
    };

    const jwtUser = await getUserFromToken(h);
    let publicLinkAttempt: PublicLinkAttempt | undefined;
    // Resolve a supplied UUID even when the JWT is valid: the JWT remains the
    // principal, while publicLinkInfo reuses this attempt without a second
    // lookup. Browser requests normally send authorization or UUID, not both.
    if (h.uuid) {
      publicLinkAttempt = await resolvePublicLinkAttempt(
        h.uuid,
        h.galleryPasscode,
        new Date(),
      );
    }
    const authentication = requestAuthentication(jwtUser, publicLinkAttempt);
    const user = principalUser(authentication);
    const userHomeFolder =
      authentication.principal.kind === 'public_link'
        ? publicLinkAttempt?.homeFolder
        : await dbFolderForId(user?.folderId);
    const extra = extraUserProps(
      user?.userType ? { userType: UserType[user.userType] } : undefined,
    );

    const scanFolderIds = request.raw
      ? createOnViewScanSet(request.raw)
      : undefined;

    return {
      headers: h,
      authentication,
      user,
      userHomeFolder,
      scanFolderIds,
      ...extra,
    } as Record<string, unknown>;
  },
});
