import { GraphQLNonNull } from 'graphql';
import type { MediaResultsSelectionInput } from '../../mediaResults/mediaResultsSelection.js';
import { createAuthorizedMediaResultsSelection } from '../../mediaResults/mediaResultsSelection.js';
import { recordAuthorizedFolderDownload } from '../../helpers/folderDownload.js';
import { hashZipFiles } from '../../helpers/zip.js';
import { addToZipQueue } from '../../helpers/zipQueue.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import {
  mediaExportArtifactType,
  mediaResultsSelectionInputType,
} from '../types/mediaResultsType.js';

interface GenerateMediaResultsZipArgs {
  input: MediaResultsSelectionInput;
}

const resolver: PicrResolver<object, GenerateMediaResultsZipArgs> = async (
  _,
  { input },
  context,
) => {
  const selection = await createAuthorizedMediaResultsSelection(context, input);
  await recordAuthorizedFolderDownload(
    context,
    selection.user,
    selection.rootFolder,
  );
  const selectedFiles = await selection.filesForExport();
  const files = selectedFiles.map(({ file, relativePath }) => ({
    id: file.id,
    fileHash: file.fileHash,
    relativePath: file.relativePath,
    name: file.name,
    archivePath: relativePath ? `${relativePath}/${file.name}` : file.name,
  }));
  const queued = hashZipFiles(
    selection.rootFolder,
    files,
    selection.selectionFingerprint,
  );
  addToZipQueue(queued);
  return {
    token: queued.hash,
    count: files.length,
    filename: `${selection.rootFolder.name}.zip`,
  };
};

export const generateMediaResultsZip = {
  type: new GraphQLNonNull(mediaExportArtifactType),
  resolve: resolver,
  args: {
    input: { type: new GraphQLNonNull(mediaResultsSelectionInputType) },
  },
};
