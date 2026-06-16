import { GraphQLNonNull } from 'graphql';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { runBenchmark as runBenchmarkService } from '../../benchmark/runBenchmark.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { benchmarkResultType } from '../types/benchmarkType.js';

const resolver: PicrResolver = async (_, _params, context) => {
  await contextPermissions(context, 1, 'Admin');
  return runBenchmarkService();
};

export const runBenchmark = {
  type: new GraphQLNonNull(benchmarkResultType),
  resolve: resolver,
};
