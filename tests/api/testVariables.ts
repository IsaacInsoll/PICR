export const testUrl = 'http://localhost:6901/';
export const pingToken = 'a'.repeat(64);

export const photoFolderId = '3';
export const videoFolderId = '2';

// Host-side connection to the `test-db` service in tests/api/compose.yml (port
// mapping and credentials must match). Only for the direct-database pattern
// described in tests/AGENTS.md.
export const testDatabaseUrl = 'postgres://user:pass@localhost:54313/picr';
