import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { authMutation } from './authMutation';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { folderResolver } from './resolvers/folderResolver';
import { fileResolver } from './resolvers/fileResolver';
import { publicLinkResolver } from './resolvers/publicLinkResolver';

export const gqlserver = createHandler({
  schema: schema,
  context: async (req, params) => {
    const headers = req.headers as IncomingCustomHeaders;
    return { auth: headers.authorization ?? '', uuid: headers.uuid };
  },
  rootValue: {
    folder: folderResolver,
    file: fileResolver,
    auth: authMutation,
    publicLinks: publicLinkResolver,
  },
});
