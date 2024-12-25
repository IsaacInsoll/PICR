import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { primaryColorEnum, themeModeEnum } from '../enums/themeModeEnum';
import { folderType } from './folderType';

export const brandingType = new GraphQLObjectType({
  name: 'Branding',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    folder: { type: folderType },
  }),
});
