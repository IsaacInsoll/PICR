import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { fileInterface } from '../interfaces/fileInterface.js';
import { folderType } from './folderType.js';
import {
  fileFlagEnum,
  mediaAspectFilterEnum,
  mediaCommentsFilterEnum,
  mediaMatchSourceEnum,
  mediaResultSortDirectionEnum,
  mediaResultSortTypeEnum,
  mediaTypeFilterEnum,
  ratingComparisonEnum,
} from './enums.js';
import type {
  AuthorizedMediaResultsSelection,
  MediaResultsPageValue,
} from '../../mediaResults/mediaResultsSelection.js';

export const mediaResultsRatingInputType = new GraphQLInputObjectType({
  name: 'MediaResultsRatingInput',
  fields: {
    comparison: { type: new GraphQLNonNull(ratingComparisonEnum) },
    value: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const mediaResultsFilterInputType = new GraphQLInputObjectType({
  name: 'MediaResultsFilterInput',
  fields: {
    mediaType: { type: mediaTypeFilterEnum },
    aspect: { type: mediaAspectFilterEnum },
    flag: { type: fileFlagEnum },
    rating: { type: mediaResultsRatingInputType },
    comments: { type: mediaCommentsFilterEnum },
    folderIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLID)),
    },
  },
});

export const mediaResultsSortInputType = new GraphQLInputObjectType({
  name: 'MediaResultsSortInput',
  fields: {
    type: { type: new GraphQLNonNull(mediaResultSortTypeEnum) },
    direction: {
      type: new GraphQLNonNull(mediaResultSortDirectionEnum),
    },
  },
});

export const mediaResultsInputType = new GraphQLInputObjectType({
  name: 'MediaResultsInput',
  fields: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    query: { type: GraphQLString },
    filters: { type: mediaResultsFilterInputType },
    sort: { type: new GraphQLNonNull(mediaResultsSortInputType) },
    first: {
      type: new GraphQLNonNull(GraphQLInt),
      defaultValue: 100,
    },
    after: { type: GraphQLString },
  },
});

export const mediaResultsSelectionInputType = new GraphQLInputObjectType({
  name: 'MediaResultsSelectionInput',
  fields: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    query: { type: GraphQLString },
    filters: { type: mediaResultsFilterInputType },
  },
});

const mediaResultEdgeType = new GraphQLObjectType({
  name: 'MediaResultEdge',
  fields: {
    cursor: { type: new GraphQLNonNull(GraphQLString) },
    file: { type: new GraphQLNonNull(fileInterface) },
    folder: { type: new GraphQLNonNull(folderType) },
    relativePath: { type: new GraphQLNonNull(GraphQLString) },
    matchSource: { type: mediaMatchSourceEnum },
  },
});

const mediaResultsPageInfoType = new GraphQLObjectType({
  name: 'MediaResultsPageInfo',
  fields: {
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    endCursor: { type: GraphQLString },
  },
});

const mediaFolderFacetType = new GraphQLObjectType({
  name: 'MediaFolderFacet',
  fields: {
    folder: { type: new GraphQLNonNull(folderType) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
    relativePath: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export class MediaResultsConnectionValue {
  private pagePromise?: Promise<MediaResultsPageValue>;
  private totalsPromise?: ReturnType<AuthorizedMediaResultsSelection['totals']>;
  private readonly folderFacetsPromises = new Map<
    string,
    ReturnType<AuthorizedMediaResultsSelection['folderFacets']>
  >();

  constructor(
    readonly selection: AuthorizedMediaResultsSelection,
    readonly first: number,
    readonly after: string | null,
  ) {}

  page() {
    this.pagePromise ??= this.selection.page({
      first: this.first,
      after: this.after,
    });
    return this.pagePromise;
  }

  totals() {
    this.totalsPromise ??= this.selection.totals();
    return this.totalsPromise;
  }

  folderFacets(args: {
    parentFolderId?: string | null;
    first: number;
    after?: string | null;
  }) {
    const key = JSON.stringify(args);
    const existing = this.folderFacetsPromises.get(key);
    if (existing) return existing;
    const pending = this.selection.folderFacets(args);
    this.folderFacetsPromises.set(key, pending);
    return pending;
  }
}

const mediaFolderFacetsPageType = new GraphQLObjectType({
  name: 'MediaFolderFacetsPage',
  fields: {
    facets: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(mediaFolderFacetType)),
      ),
    },
    pageInfo: { type: new GraphQLNonNull(mediaResultsPageInfoType) },
  },
});

export const mediaResultsConnectionType = new GraphQLObjectType({
  name: 'MediaResultsConnection',
  fields: {
    edges: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(mediaResultEdgeType)),
      ),
      resolve: async (source: MediaResultsConnectionValue) =>
        (await source.page()).edges,
    },
    pageInfo: {
      type: new GraphQLNonNull(mediaResultsPageInfoType),
      resolve: async (source: MediaResultsConnectionValue) =>
        (await source.page()).pageInfo,
    },
    totalCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (source: MediaResultsConnectionValue) =>
        (await source.totals()).totalCount,
    },
    folderCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (source: MediaResultsConnectionValue) =>
        (await source.totals()).folderCount,
    },
    selectionFingerprint: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (source: MediaResultsConnectionValue) =>
        source.selection.selectionFingerprint,
    },
    selectedFolders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: (source: MediaResultsConnectionValue) =>
        source.selection.selectedFolders,
    },
    folderFacets: {
      type: new GraphQLNonNull(mediaFolderFacetsPageType),
      args: {
        parentFolderId: { type: GraphQLID },
        first: {
          type: new GraphQLNonNull(GraphQLInt),
          defaultValue: 100,
        },
        after: { type: GraphQLString },
      },
      resolve: (
        source: MediaResultsConnectionValue,
        args: {
          parentFolderId?: string | null;
          first: number;
          after?: string | null;
        },
      ) => source.folderFacets(args),
    },
  },
});

export const mediaMatchSummaryType = new GraphQLObjectType({
  name: 'MediaMatchSummary',
  fields: {
    directCount: { type: new GraphQLNonNull(GraphQLInt) },
    treeCount: { type: new GraphQLNonNull(GraphQLInt) },
    selectionFingerprint: { type: new GraphQLNonNull(GraphQLString) },
  },
});
