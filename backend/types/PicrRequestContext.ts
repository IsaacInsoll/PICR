import { UserFields } from '../db/picrDb';
import { IncomingCustomHeaders } from './incomingCustomHeaders';

export type PicrRequestContext = {
  user?: UserFields;
  headers: IncomingCustomHeaders;
};
