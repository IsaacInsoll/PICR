import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { authMutation } from './authMutation';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { folderResolver } from './resolvers/folderResolver';
import { fileResolver } from './resolvers/fileResolver';
import { userResolver, usersResolver } from './resolvers/userResolver';
import { editUser } from './editUser';

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
    users: usersResolver,
    user: userResolver,
    // Mutations
    auth: authMutation,
    editUser: editUser,
  },
});
