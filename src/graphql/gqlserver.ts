import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema/schema';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';

export const gqlserver = createHandler({
  schema: schema,
  context: async (req, params) => {
    const headers = req.headers as IncomingCustomHeaders;
    return { auth: headers.authorization ?? '', uuid: headers.uuid };
  },
});
