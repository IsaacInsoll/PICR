import { hashFolderContents } from '../../helpers/zip.js';
import { addToZipQueue } from '../../helpers/zipQueue.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationGenerateZipArgs } from '@shared/gql/graphql.js';
import { recordFolderDownload } from '../../helpers/folderDownload.js';

const resolver: PicrResolver<object, MutationGenerateZipArgs> = async (
  _,
  params,
  context,
) => {
  const { folder } = await recordFolderDownload(
    context,
    Number(params.folderId),
  );

  const h = await hashFolderContents(folder);
  addToZipQueue(h);
  return h.hash;
};

export const generateZip = {
  type: new GraphQLNonNull(GraphQLString),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
