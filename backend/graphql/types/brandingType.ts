import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { userType } from './userType';
import { GraphQLDateTime } from 'graphql-scalars';
import { fileType } from './fileType';
import { primaryColorEnum, themeModeEnum } from '../enums/themeModeEnum';

export const brandingType = new GraphQLObjectType({
  name: 'Branding',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
  }),
});
