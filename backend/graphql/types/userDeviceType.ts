import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const userDeviceType = new GraphQLObjectType({
  name: 'UserDevice',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    notificationToken: { type: GraphQLString },
    enabled: { type: new GraphQLNonNull(GraphQLBoolean) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    // user: { type: userType },
  }),
});
