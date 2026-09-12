import { GraphQLNonNull } from 'graphql';
import type {
  MediaResultsFilterInput,
  MediaResultsSelectionInput,
  MediaResultsSortInput,
} from '../../mediaResults/mediaResultsSelection.js';
import { createAuthorizedMediaResultsSelection } from '../../mediaResults/mediaResultsSelection.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import {
  MediaResultsConnectionValue,
  mediaMatchSummaryType,
  mediaResultsConnectionType,
  mediaResultsInputType,
  mediaResultsSelectionInputType,
} from '../types/mediaResultsType.js';

interface MediaResultsArgs {
  input: {
    folderId: string;
    query?: string | null;
    filters?: MediaResultsFilterInput | null;
    sort: MediaResultsSortInput;
    first: number;
    after?: string | null;
  };
}

interface MediaMatchSummaryArgs {
  input: MediaResultsSelectionInput;
}

const mediaResultsResolver: PicrResolver<object, MediaResultsArgs> = async (
  _,
  { input },
  context,
) => {
  const selection = await createAuthorizedMediaResultsSelection(context, input);
  return new MediaResultsConnectionValue(
    selection,
    input.first,
    input.after ?? null,
  );
};

const mediaMatchSummaryResolver: PicrResolver<
  object,
  MediaMatchSummaryArgs
> = async (_, { input }, context) => {
  const selection = await createAuthorizedMediaResultsSelection(context, input);
  return selection.summary();
};

export const mediaResults = {
  type: new GraphQLNonNull(mediaResultsConnectionType),
  resolve: mediaResultsResolver,
  args: {
    input: { type: new GraphQLNonNull(mediaResultsInputType) },
  },
};

export const mediaMatchSummary = {
  type: new GraphQLNonNull(mediaMatchSummaryType),
  resolve: mediaMatchSummaryResolver,
  args: {
    input: { type: new GraphQLNonNull(mediaResultsSelectionInputType) },
  },
};
