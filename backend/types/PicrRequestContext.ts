import type { FolderFields, UserFields } from '../db/picrDb.js';
import type { IncomingCustomHeaders } from './incomingCustomHeaders.js';
import type { ExtraUserProps } from '@shared/extraUserProps.js';

export type PicrRequestContext = {
  user?: UserFields;
  userHomeFolder?: FolderFields;
  headers: IncomingCustomHeaders;
} & ExtraUserProps;
