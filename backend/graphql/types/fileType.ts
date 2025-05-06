import { GraphQLObjectType } from 'graphql';
import {
  fileInterface,
  fileInterfaceFields,
} from "../interfaces/fileInterface.js";

export const fileType = new GraphQLObjectType({
  name: 'File',
  interfaces: [fileInterface],
  fields: {
    ...fileInterfaceFields(),
  },
});
