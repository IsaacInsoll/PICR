import { GraphQLError } from 'graphql/error';
import { FolderPermissions } from '../types/FolderPermissions';

export const doAuthError = (str: string | undefined) => {
  throw new GraphQLError('AUTH' + (str ? `: ${str}` : ''));
};

export const RejectIfNoPermissions = (fp: FolderPermissions) => {
  if (fp === 'None') {
    doAuthError('No access to this folder');
  }
};
