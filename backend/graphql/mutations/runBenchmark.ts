import { GraphQLNonNull, GraphQLString } from 'graphql';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { runBenchmark as runBenchmarkService } from '../../benchmark/runBenchmark.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { benchmarkResultType } from '../types/benchmarkType.js';

interface RunBenchmarkArgs {
  assetPath?: string | null;
}

const resolver: PicrResolver<object, RunBenchmarkArgs> = async (
  _,
  params,
  context,
) => {
  await contextPermissions(context, 1, 'Admin');
  return runBenchmarkService({ assetPath: params.assetPath });
};

export const runBenchmark = {
  type: new GraphQLNonNull(benchmarkResultType),
  args: {
    assetPath: { type: GraphQLString },
  },
  resolve: resolver,
};
