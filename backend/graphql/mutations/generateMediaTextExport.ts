import { GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { contextPermissions } from '../../auth/contextPermissions.js';
import {
  createAuthorizedMediaResultsSelection,
  type MediaResultsSelectionInput,
} from '../../mediaResults/mediaResultsSelection.js';
import {
  generateMediaTextExport as generateTextArtifact,
  type MediaTextExportFormat,
} from '../../mediaResults/mediaTextExport.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { mediaTextExportFormatEnum } from '../types/enums.js';
import {
  mediaExportArtifactType,
  mediaResultsSelectionInputType,
} from '../types/mediaResultsType.js';

interface GenerateMediaTextExportArgs {
  input: MediaResultsSelectionInput;
  format: MediaTextExportFormat;
  excludeExtensions: boolean;
}

const resolver: PicrResolver<object, GenerateMediaTextExportArgs> = async (
  _,
  { input, format, excludeExtensions },
  context,
) => {
  await contextPermissions(context, Number(input.folderId), 'Admin');
  const selection = await createAuthorizedMediaResultsSelection(context, input);
  return generateTextArtifact({ selection, format, excludeExtensions });
};

export const generateMediaTextExport = {
  type: new GraphQLNonNull(mediaExportArtifactType),
  resolve: resolver,
  args: {
    input: { type: new GraphQLNonNull(mediaResultsSelectionInputType) },
    format: { type: new GraphQLNonNull(mediaTextExportFormatEnum) },
    excludeExtensions: {
      type: new GraphQLNonNull(GraphQLBoolean),
      defaultValue: false,
    },
  },
};
