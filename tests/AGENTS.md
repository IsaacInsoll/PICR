# Test Suite Development Guide

End-to-end API tests using Vitest with Docker-based test environment.

The only supported production setup is docker (on either x64 or ARM) so testing is done with a built docker container to most closely match production. 

## Architecture

```mermaid
flowchart TB
    subgraph Host["Host Machine"]
        VT[Vitest Runner]
        TC[Test Cases]
    end

    subgraph Docker["Docker Compose"]
        APP[test-picr:6901]
        DB[(test-db:54313)]
    end

    subgraph Fixtures["Test Fixtures"]
        MEDIA[Sample Media]
        ZIP[sample.zip]
    end

    VT --> TC
    TC -->|GraphQL| APP
    APP --> DB
    MEDIA --> APP
    ZIP -->|extract| MEDIA
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Vitest 3.1 | Test runner |
| Docker Compose | Test environment |
| URQL | GraphQL client for tests |
| PostgreSQL 16 | Test database (tmpfs) |

## Directory Structure

```
tests/
├── compose.yml               # Docker Compose configuration
├── testSetup.ts              # Global setup/teardown
├── testVariables.ts          # Shared test constants
├── 00-express-server.test.ts # Server connectivity tests
├── 01-admin-login.test.ts    # Authentication tests
├── 02-view-and-search-folders.test.ts # Folder/search tests
├── 03-public-link.test.ts    # Public sharing tests
└── env/
    ├── media/                # Test media files (extracted)
    │   ├── Dog Photos/       # 10 JPG images
    │   └── Birthday Video/   # 1 MP4 video
    ├── cache/                # Generated thumbnails
    └── sample.zip            # Source fixture archive
```

## Running Tests

### Run All Tests

```bash
npm test
```

This:
1. Downloads sample media (first run only)
2. Builds Docker images
3. Starts test containers
4. Runs all test suites
5. Tears down containers

### Run Specific Test

```bash
npx vitest tests/01-admin-login.test.ts
```

### Watch Mode (Development)

```bash
npx vitest --watch tests/01-admin-login.test.ts
```

## Test File Naming

Tests are prefixed with numbers for execution order:

```
00-*.test.ts  # Infrastructure tests (server online)
01-*.test.ts  # Authentication tests
02-*.test.ts  # Core feature tests
03-*.test.ts  # Advanced feature tests
...
```

Increment the prefix when adding new test files.

## Test Setup

### Global Setup (`testSetup.ts`)

Runs once before all tests:

1. **Download fixtures** (if not cached)
   - Downloads `picr-demo-data.zip` (~30MB)
   - Caches in `tests/env/sample.zip`

2. **Prepare directories**
   - Clears `tests/env/media/`
   - Clears `tests/env/cache/`
   - Extracts sample media

3. **Start Docker containers**
   - Builds `test-picr` service
   - Starts PostgreSQL + app
   - Waits for services to be ready

### Global Teardown

Runs after all tests complete:
- Stops and removes containers
- Preserves images for faster subsequent runs

## Docker Configuration

### `compose.yml`

```yaml
services:
  test-picr:
    build: ..
    ports:
      - "6901:6900"
    environment:
      DATABASE_URL: postgres://user:pass@test-db/picr
      USE_POLLING: true
      BASE_URL: http://localhost:6901/
    volumes:
      - ./env/media:/home/node/app/media:ro
    depends_on:
      - test-db

  test-db:
    image: postgres:16
    ports:
      - "54313:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: picr
    tmpfs:
      - /var/lib/postgresql/data  # RAM-based, wiped each run
```

### Key Design Decisions

- **tmpfs database**: Tests run in isolation, no state leakage
- **Docker-based**: Catches "works in dev, fails in Docker" issues
- **Read-only media**: Prevents tests from modifying fixtures
- **Separate ports**: 6901/54313 to avoid conflicts with dev server

## Writing Tests

### Critical: Use Shared Queries and Mutations

**ALWAYS import queries/mutations from `shared/urql/`** instead of writing inline GraphQL. This ensures tests validate the actual queries used by the frontend and app. If a shared query breaks, tests will catch it.

```typescript
// CORRECT - uses shared queries
import { viewFolderQuery } from '../shared/urql/queries/viewFolderQuery';
import { editBrandingMutation } from '../shared/urql/mutations/editBrandingMutation';

// WRONG - inline GraphQL bypasses real query validation
const result = await graphqlRequest(`
  query { folder(id: $id) { ... } }
`, variables, headers);
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../shared/urql/queries/viewFolderQuery';
import { photoFolderId } from './testVariables';

describe('Folder Viewing', () => {
  it('should load folder with files', async () => {
    // 1. Setup: Get authenticated client
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    // 2. Execute: Run query using shared query
    const result = await client
      .query(viewFolderQuery, { folderId: photoFolderId })
      .toPromise();

    // 3. Assert: Check results
    expect(result.error).toBeUndefined();
    expect(result.data?.folder).toBeDefined();
    expect(result.data!.folder.files.length).toBe(10);
  });
});
```

### Test Utilities

#### `createTestGraphqlClient(headers)`

Creates URQL client pointing to test server:

```typescript
import { createTestGraphqlClient } from '../frontend/testGraphqlClient';

const client = await createTestGraphqlClient({});  // Unauthenticated
const client = await createTestGraphqlClient({ authorization: 'Bearer ...' });
```

#### `getUserHeader(credentials)`

Gets JWT auth header for admin login:

```typescript
import { getUserHeader } from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';

const headers = await getUserHeader(defaultCredentials);
// Returns: { authorization: 'Bearer eyJ...' }
```

#### `getLinkHeader(uuid)`

Gets header for public link access:

```typescript
import { getLinkHeader } from '../frontend/testGraphqlClient';

const headers = await getLinkHeader('public-test-user');
// Returns: { uuid: 'public-test-user' }
```

### Import Patterns

Always use relative imports from the test file location:

```typescript
// Test utilities
import { createTestGraphqlClient, getUserHeader, getLinkHeader } from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';

// Shared queries and mutations (ALWAYS use these, never inline GraphQL)
import { viewFolderQuery } from '../shared/urql/queries/viewFolderQuery';
import { editBrandingMutation } from '../shared/urql/mutations/editBrandingMutation';

// GraphQL types and enums
import { ThemeMode, PrimaryColor, CommentPermissions } from '../graphql-types';

// Test variables
import { photoFolderId, videoFolderId } from './testVariables';
```

### Test Variables

```typescript
// tests/testVariables.ts
export const testUrl = 'http://localhost:6901/';
export const photoFolderId = '3';      // Dog Photos folder
export const videoFolderId = '2';      // Birthday Video folder
export const testPublicLink = {
  folderId: photoFolderId,
  name: 'Public Test User',
  uuid: 'public-test-user',
  // ...
};
```

## Test Patterns

### Testing Authenticated Queries

```typescript
it('admin can view folder', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .query(viewFolderQuery, { folderId: '1' })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.folder.permissions).toBe('Admin');
});
```

### Testing Public Links

```typescript
it('link user can view shared folder', async () => {
  // First, create the public link (as admin)
  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(editUserMutation, testPublicLink).toPromise();

  // Then, access as link user
  const linkHeaders = await getLinkHeader(testPublicLink.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  const result = await linkClient
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.folder.permissions).toBe('View');
});
```

### Testing Error Cases

```typescript
it('unauthenticated request fails', async () => {
  const client = await createTestGraphqlClient({});  // No auth

  const result = await client
    .query(viewFolderQuery, { folderId: '1' })
    .toPromise();

  expect(result.error).toBeDefined();
  expect(result.data?.folder).toBeUndefined();
});
```

### Testing Mutations

Always import mutations from `shared/urql/mutations/`:

```typescript
import { addCommentMutation } from '../shared/urql/mutations/addCommentMutation';
import { editBrandingMutation } from '../shared/urql/mutations/editBrandingMutation';

it('can add comment', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .mutation(addCommentMutation, {
      fileId: '1',
      comment: 'Test comment',
      rating: 5,
    })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.addComment.rating).toBe(5);
});
```

## Adding a New Test File

1. Create file with numbered prefix:
   ```typescript
   // tests/07-new-feature.test.ts
   import { expect, test, describe } from 'vitest';
   import { createTestGraphqlClient, getUserHeader } from '../frontend/testGraphqlClient';
   import { defaultCredentials } from '../backend/auth/defaultCredentials';
   // Import shared queries/mutations - NEVER write inline GraphQL
   import { someQuery } from '../shared/urql/queries/someQuery';
   import { someMutation } from '../shared/urql/mutations/someMutation';
   import { photoFolderId } from './testVariables';

   describe('New Feature', () => {
     test('should do something', async () => {
       const headers = await getUserHeader(defaultCredentials);
       const client = await createTestGraphqlClient(headers);

       const result = await client
         .query(someQuery, { folderId: photoFolderId })
         .toPromise();

       expect(result.error).toBeUndefined();
       expect(result.data?.something).toBeDefined();
     });
   });
   ```

2. Add any new test variables to `testVariables.ts`

3. Run to verify:
   ```bash
   npx vitest tests/07-new-feature.test.ts
   ```

### Why Use Shared Queries?

Tests import the **same queries and mutations** used by the frontend and app. This provides:

1. **Real-world validation** - Tests verify the actual GraphQL operations clients use
2. **Automatic breakage detection** - If someone modifies a shared query incorrectly, tests fail
3. **No drift** - Inline GraphQL in tests can become outdated while shared queries evolve
4. **Type safety** - Shared queries have TypeScript types generated by codegen

## Fixtures

### Sample Media

Downloaded from `https://photosummaryapp.com/picr-demo-data.zip`:

| Folder | Contents |
|--------|----------|
| Dog Photos | 10 JPG images (~17.6 MB) |
| Birthday Video | 1 MP4 video (~11.2 MB) |

### Adding New Fixtures

1. Add files to local `tests/env/media/`
2. Update `sample.zip` if needed
3. Update `testVariables.ts` with new folder/file IDs
4. Note: IDs are auto-generated, check database after first run

## Troubleshooting

### All tests failing

Docker containers likely didn't start:

```bash
cd tests
docker compose build
docker compose up  # Watch for errors
```

### Database connection errors

1. Check PostgreSQL container is running:
   ```bash
   docker compose ps
   ```

2. Check port 54313 is free:
   ```bash
   lsof -i :54313
   ```

### Tests pass locally, fail in CI

1. Check CI has Docker installed
2. Check ports aren't blocked
3. Check sample media downloaded successfully

### Slow tests

1. First run downloads ~30MB of fixtures
2. Docker build is cached after first run
3. tmpfs database is fast, shouldn't be bottleneck

### Stale test data

Tests run against fresh database each time (tmpfs). If seeing stale data:

```bash
# Force rebuild
docker compose build --no-cache
docker compose down -v
```

## CI Integration

Tests run in GitHub Actions:

```yaml
- name: Download sample files
  run: wget https://photosummaryapp.com/picr-demo-data.zip -O tests/env/sample.zip

- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm test
```

Tests also run before releases (enforced by `release-it` config).
