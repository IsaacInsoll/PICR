import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const dashboardStatsType = new GraphQLObjectType({
  name: 'DashboardStats',
  fields: () => ({
    totalFiles: { type: new GraphQLNonNull(GraphQLInt) },
    totalImages: { type: new GraphQLNonNull(GraphQLInt) },
    totalFolders: { type: new GraphQLNonNull(GraphQLInt) },
    totalSize: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const dashboardUpdateInfoType = new GraphQLObjectType({
  name: 'DashboardUpdateInfo',
  fields: () => ({
    version: { type: new GraphQLNonNull(GraphQLString) },
    latest: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
