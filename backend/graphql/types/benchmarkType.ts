import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import type {
  BenchmarkResult,
  NamedBenchmarkStepResult,
} from '../../benchmark/runBenchmark.js';

export const namedBenchmarkStepType =
  new GraphQLObjectType<NamedBenchmarkStepResult>({
    name: 'NamedBenchmarkStep',
    fields: () => ({
      key: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      status: { type: new GraphQLNonNull(GraphQLString) },
      ms: { type: GraphQLFloat },
      skippedReason: { type: GraphQLString },
      outputBytes: { type: GraphQLBigInt },
      details: { type: GraphQLString },
      includedInTotal: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });

export const benchmarkResultType = new GraphQLObjectType<BenchmarkResult>({
  name: 'BenchmarkResult',
  fields: () => ({
    totalMs: { type: new GraphQLNonNull(GraphQLFloat) },
    appVersion: { type: new GraphQLNonNull(GraphQLString) },
    steps: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(namedBenchmarkStepType)),
      ),
    },
    videoAccelerationMode: { type: new GraphQLNonNull(GraphQLString) },
    videoAccelerationReason: { type: new GraphQLNonNull(GraphQLString) },
    cpuCount: { type: new GraphQLNonNull(GraphQLInt) },
    uvThreadpoolSize: { type: new GraphQLNonNull(GraphQLString) },
    imageCount: { type: new GraphQLNonNull(GraphQLInt) },
    videoCount: { type: new GraphQLNonNull(GraphQLInt) },
    assetSourceUrl: { type: new GraphQLNonNull(GraphQLString) },
    assetPath: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
