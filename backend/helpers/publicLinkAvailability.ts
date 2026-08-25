import type { UserFields } from '../db/picrDb.js';
import { UserType } from '@shared/gql/graphql.js';
import { isPublicLinkExpired } from '@shared/publicLinkExpiration.js';

type PublicLinkAvailabilityFields = Pick<
  UserFields,
  'deleted' | 'enabled' | 'expiresAt' | 'userType'
>;

export const isPublicLinkAvailable = (
  user: PublicLinkAvailabilityFields | null | undefined,
  now: Date,
): user is PublicLinkAvailabilityFields =>
  !!user &&
  user.userType === UserType.Link &&
  user.enabled &&
  !user.deleted &&
  !isPublicLinkExpired(user.expiresAt, now);
