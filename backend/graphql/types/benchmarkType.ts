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
    videoThumbnailCpu: { type: new GraphQLNonNull(benchmarkStepType) },
    videoThumbnailAccelerated: { type: new GraphQLNonNull(benchmarkStepType) },
    videoTranscodeCpu: { type: new GraphQLNonNull(benchmarkStepType) },
    videoTranscodeAccelerated: { type: new GraphQLNonNull(benchmarkStepType) },
    videoAccelerationMode: { type: new GraphQLNonNull(GraphQLString) },
    videoAccelerationReason: { type: new GraphQLNonNull(GraphQLString) },
    imageCount: { type: new GraphQLNonNull(GraphQLInt) },
    videoCount: { type: new GraphQLNonNull(GraphQLInt) },
    assetSourceUrl: { type: new GraphQLNonNull(GraphQLString) },
    assetPath: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
