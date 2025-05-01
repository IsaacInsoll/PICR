import { FolderFields, UserFields } from '../db/picrDb';
import { IncomingCustomHeaders } from './incomingCustomHeaders';

export type PicrRequestContext = {
  user?: UserFields;
  userHomeFolder?: FolderFields;
  headers: IncomingCustomHeaders;
};
