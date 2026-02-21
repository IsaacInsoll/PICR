import { setupTestEnvironment } from '../api/testEnvironment';

async function globalSetup() {
  await setupTestEnvironment();
}

export default globalSetup;
