import type { PublicLinkAuthOutcome } from '../auth/publicLinkAuth.js';
import type { FolderFields, UserFields } from '../db/picrDb.js';

export type RequestPrincipal =
  | { kind: 'jwt'; user: UserFields }
  | { kind: 'public_link'; user: UserFields }
  | { kind: 'anonymous' };

export type PublicLinkAttempt = {
  uuid: string;
  outcome: PublicLinkAuthOutcome;
  homeFolder?: FolderFields;
};

export type RequestAuthentication = {
  principal: RequestPrincipal;
  publicLinkAttempt?: PublicLinkAttempt;
};

export const requestAuthentication = (
  jwtUser: UserFields | undefined,
  publicLinkAttempt?: PublicLinkAttempt,
): RequestAuthentication => {
  if (jwtUser) {
    return { principal: { kind: 'jwt', user: jwtUser }, publicLinkAttempt };
  }
  if (publicLinkAttempt?.outcome.status === 'authenticated') {
    return {
      principal: {
        kind: 'public_link',
        user: publicLinkAttempt.outcome.user,
      },
      publicLinkAttempt,
    };
  }
  return { principal: { kind: 'anonymous' }, publicLinkAttempt };
};

export const principalUser = (
  authentication: RequestAuthentication,
): UserFields | undefined =>
  authentication.principal.kind === 'anonymous'
    ? undefined
    : authentication.principal.user;
