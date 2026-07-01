import { existsSync, mkdirSync, rmSync } from 'node:fs';
import {
  buildOne,
  downMany,
  type IDockerComposeOptions,
  upMany,
} from 'docker-compose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId, testUrl, videoFolderId } from './testVariables';

const services = ['test-picr', 'test-db'];
const testApiDir = path.dirname(fileURLToPath(import.meta.url));

const composeOpts: IDockerComposeOptions = {
  cwd: testApiDir,
  log: false,
};

export async function setupTestEnvironment() {
  console.log('🧪 Test Setup Starting');
  const media = './tests/api/env/media';
  const cache = './tests/api/env/cache';
  if (!existsSync(media)) {
    throw new Error(
      `Test media not found at ${media}. Fixtures are committed to the repo — check your working tree.`,
    );
  }
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  console.log('\t🐋 Docker Starting');
  await buildOne(services[0], composeOpts);
  await upMany(services, composeOpts);
  console.log('\t🐋 Docker Startup Complete');
  await waitForSeedMedia();
  console.log('🧪 Test Setup Complete');
}

export async function teardownTestEnvironment() {
  console.log('🧪 Test Teardown Starting');
  await downMany(services, composeOpts);
  console.log('🧪 Test Teardown Complete');
}

const waitForSeedMedia = async () => {
  const started = Date.now();
  let lastError: unknown = null;

  while (Date.now() - started < 30_000) {
    try {
      const token = await loginForReadinessCheck();
      const data = await graphqlForReadinessCheck<SeedMediaResponse>(
        token,
        `query SeedMedia($photo: ID!, $video: ID!) {
          photo: folder(id: $photo) {
            files { __typename }
          }
          video: folder(id: $video) {
            files { __typename }
          }
        }`,
        { photo: photoFolderId, video: videoFolderId },
      );

      const hasPhoto = data.photo?.files.some(
        (file) => file.__typename === 'Image',
      );
      const hasVideo = data.video?.files.some(
        (file) => file.__typename === 'Video',
      );

      if (hasPhoto && hasVideo) return;
      lastError = new Error('Seed media not visible yet');
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for seed media: ${String(lastError)}`);
};

type SeedMediaResponse = {
  photo?: { files: Array<{ __typename: string }> } | null;
  video?: { files: Array<{ __typename: string }> } | null;
};

const loginForReadinessCheck = async (): Promise<string> => {
  const data = await graphqlForReadinessCheck<{ auth: string }>(
    null,
    `mutation Login($user: String!, $password: String!) {
      auth(user: $user, password: $password)
    }`,
    {
      user: defaultCredentials.username,
      password: defaultCredentials.password,
    },
  );
  return data.auth;
};

const graphqlForReadinessCheck = async <T>(
  token: string | null,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(testUrl + 'graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL readiness HTTP ${response.status}`);
  }
  const body = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join(', '));
  }
  if (!body.data) throw new Error('GraphQL readiness response had no data');
  return body.data;
};
