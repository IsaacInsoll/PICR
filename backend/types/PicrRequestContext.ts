import { FolderFields, UserFields } from '../db/picrDb';
import { IncomingCustomHeaders } from './incomingCustomHeaders';
import { ExtraUserProps } from '../helpers/extraUserProps';

export type PicrRequestContext = {
  user?: UserFields;
  userHomeFolder?: FolderFields;
  headers: IncomingCustomHeaders;
} & ExtraUserProps;
