import { teardownTestEnvironment } from '../api/testEnvironment';

async function globalTeardown() {
  await teardownTestEnvironment();
}

export default globalTeardown;
