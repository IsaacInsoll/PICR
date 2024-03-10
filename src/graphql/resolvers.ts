import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { authMutation } from './authMutation';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { folderResolver } from './resolvers/folderResolver';
import { fileResolver } from './resolvers/fileResolver';
import {
  publicLinkResolver,
  publicLinksResolver,
} from './resolvers/publicLinkResolver';
import { editPublicLink } from './editPublicLink';

export const gqlserver = createHandler({
  schema: schema,
  context: async (req, params) => {
    const headers = req.headers as IncomingCustomHeaders;
    return { auth: headers.authorization ?? '', uuid: headers.uuid };
  },
  rootValue: {
    //Queries
    folder: folderResolver,
    file: fileResolver,
    publicLinks: publicLinksResolver,
    publicLink: publicLinkResolver,
    // Mutations
    auth: authMutation,
    editPublicLink: editPublicLink,
  },
});
