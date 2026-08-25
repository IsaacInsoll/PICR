import type { FolderFields, UserFields } from '../db/picrDb.js';
import type { IncomingCustomHeaders } from './incomingCustomHeaders.js';
import type { ExtraUserProps } from '@shared/extraUserProps.js';
import type { RequestAuthentication } from './RequestAuthentication.js';

export type PicrRequestContext = {
  authentication: RequestAuthentication;
  user?: UserFields;
  userHomeFolder?: FolderFields;
  headers: IncomingCustomHeaders;
  scanFolderIds?: Set<number>;
} & ExtraUserProps;
