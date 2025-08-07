import {
  CommentPermissions,
  EditUserMutationMutationVariables,
} from '../shared/gql/graphql.js';

export const testUrl = 'http://localhost:6901/';

export const photoFolderId = '3';
export const videoFolderId = '2';
//i don't control this but gravatar has a valid avatar for this email
export const gravatarTest = {
  email: 'test1@example.com',
  result: '//www.gravatar.com/avatar/aa99b351245441b8ca95d54a52d2998c?d=404',
};

export const testPublicLink: EditUserMutationMutationVariables = {
  folderId: photoFolderId,
  name: 'Public Test User',
  username: gravatarTest.email,
  commentPermissions: CommentPermissions.Read,
  enabled: true,
  uuid: 'public-test-user',
};
