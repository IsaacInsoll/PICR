import { gql } from '../gql.js';

export const mediaResultsPageFragment = gql(/* GraphQL */ `
  fragment MediaResultsPageFragment on MediaResultsConnection {
    edges {
      cursor
      file {
        ...FileFragment
      }
      folder {
        id
        name
        parentId
      }
      relativePath
      matchSource
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
`);

export const mediaResultsQuery = gql(/* GraphQL */ `
  query MediaResults($input: MediaResultsInput!) {
    mediaResults(input: $input) {
      ...MediaResultsPageFragment
      totalCount
      folderCount
      selectionFingerprint
      selectedFolders {
        id
        name
        parentId
      }
      folderFacets {
        facets {
          folder {
            id
            name
            parentId
          }
          count
          relativePath
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

export const mediaResultsNextPageQuery = gql(/* GraphQL */ `
  query MediaResultsNextPage($input: MediaResultsInput!) {
    mediaResults(input: $input) {
      ...MediaResultsPageFragment
      selectionFingerprint
    }
  }
`);

export const mediaFolderFacetsQuery = gql(/* GraphQL */ `
  query MediaFolderFacets(
    $input: MediaResultsInput!
    $parentFolderId: ID
    $first: Int! = 100
    $after: String
  ) {
    mediaResults(input: $input) {
      selectionFingerprint
      selectedFolders {
        id
        name
        parentId
      }
      folderFacets(
        parentFolderId: $parentFolderId
        first: $first
        after: $after
      ) {
        facets {
          folder {
            id
            name
            parentId
          }
          count
          relativePath
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

export const mediaMatchSummaryQuery = gql(/* GraphQL */ `
  query MediaMatchSummary($input: MediaResultsSelectionInput!) {
    mediaMatchSummary(input: $input) {
      directCount
      treeCount
      selectionFingerprint
    }
  }
`);
