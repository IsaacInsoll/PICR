import { IncomingHttpHeaders } from 'node:http2';

export type IncomingCustomHeaders = IncomingHttpHeaders & {
  authorization?: string;
  uuid?: string;
};
