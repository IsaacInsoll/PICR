import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import type {
  BenchmarkResult,
  BenchmarkStepResult,
} from '../../benchmark/runBenchmark.js';

export const benchmarkStepType = new GraphQLObjectType<BenchmarkStepResult>({
  name: 'BenchmarkStep',
  fields: () => ({
    ms: { type: GraphQLFloat },
    skippedReason: { type: GraphQLString },
  }),
});

export const benchmarkResultType = new GraphQLObjectType<BenchmarkResult>({
  name: 'BenchmarkResult',
  fields: () => ({
    totalMs: { type: new GraphQLNonNull(GraphQLFloat) },
    appVersion: { type: new GraphQLNonNull(GraphQLString) },
    assetSetup: { type: new GraphQLNonNull(benchmarkStepType) },
    jpegResize: { type: new GraphQLNonNull(benchmarkStepType) },
    avifResize: { type: new GraphQLNonNull(benchmarkStepType) },
    videoThumbnail: { type: new GraphQLNonNull(benchmarkStepType) },
    videoTranscode: { type: new GraphQLNonNull(benchmarkStepType) },
    imageCount: { type: new GraphQLNonNull(GraphQLInt) },
    videoCount: { type: new GraphQLNonNull(GraphQLInt) },
    assetSourceUrl: { type: new GraphQLNonNull(GraphQLString) },
    assetPath: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
