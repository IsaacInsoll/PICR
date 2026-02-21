import type { GlobalSetupContext } from 'vitest/node';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from './testEnvironment';

export async function setup(_context: GlobalSetupContext) {
  await setupTestEnvironment();
}

export async function teardown() {
  await teardownTestEnvironment();
}
