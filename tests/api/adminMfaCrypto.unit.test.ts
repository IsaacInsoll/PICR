import { afterEach, expect, test, vi } from 'vitest';
import {
  configureMfaEncryption,
  decryptMfaSecret,
  encryptMfaSecret,
  hashAuthToken,
} from '../../backend/auth/mfaCrypto';
import { picrConfig } from '../../backend/config/picrConfig';
import { envSchema } from '../../backend/config/envSchema';

const original = picrConfig.mfaEncryptionKey;
afterEach(() => {
  picrConfig.mfaEncryptionKey = original;
  vi.restoreAllMocks();
});

test('MFA environment variables accept unset and empty optional values', () => {
  for (const value of [undefined, '']) {
    const result = envSchema.parse({
      DATABASE_URL: 'postgres://user:pass@localhost/picr',
      BASE_URL: 'http://localhost:6900/',
      MFA_ENCRYPTION_KEY: value,
      MFA_ENCRYPTION_KEY_FILE: value,
    });
    expect(result.MFA_ENCRYPTION_KEY).toBeUndefined();
    expect(result.MFA_ENCRYPTION_KEY_FILE).toBeUndefined();
  }
});
test('missing key prints an inactive suggestion on each boot and never activates it', () => {
  const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  configureMfaEncryption();
  configureMfaEncryption();
  expect(output).toHaveBeenCalledTimes(2);
  expect(output.mock.calls[0][0]).toMatch(/MFA_ENCRYPTION_KEY=[a-f0-9]{64}/);
  expect(output.mock.calls[0][0]).not.toBe(output.mock.calls[1][0]);
  expect(picrConfig.mfaEncryptionKey).toBeUndefined();
  expect(() => encryptMfaSecret('secret', 1)).toThrow();
});
test('secret encryption is randomized, authenticated and bound to its admin', () => {
  configureMfaEncryption('a'.repeat(64));
  const encrypted = encryptMfaSecret('private authenticator seed', 1);
  expect(encrypted).not.toContain('private authenticator seed');
  expect(encryptMfaSecret('private authenticator seed', 1)).not.toBe(encrypted);
  expect(decryptMfaSecret(encrypted, 1)).toBe('private authenticator seed');
  expect(() => decryptMfaSecret(encrypted, 2)).toThrow();
  configureMfaEncryption('b'.repeat(64));
  expect(() => decryptMfaSecret(encrypted, 1)).toThrow();
});
test('ambiguous and malformed key configuration is rejected', () => {
  expect(() => configureMfaEncryption('a'.repeat(64), '/some/file')).toThrow(
    /only one/,
  );
  expect(() => configureMfaEncryption('invalid')).toThrow(/64 hexadecimal/);
});
test('token hashes are deterministic and do not expose the original', () => {
  expect(hashAuthToken('a')).toHaveLength(64);
  expect(hashAuthToken('a')).toBe(hashAuthToken('a'));
  expect(hashAuthToken('a')).not.toBe(hashAuthToken('b'));
});
