import { expect, test } from 'vitest';
import { parseNativeAuthorization } from '../../shared/auth/nativeAuth';
const valid = () =>
  new URLSearchParams({
    redirect_uri: 'picr://auth/callback',
    code_challenge: 'a'.repeat(43),
    code_challenge_method: 'S256',
    state: 'b'.repeat(43),
  });
test('native authorization requires exact callbacks, S256, random-state shape and unambiguous parameters', () => {
  expect(parseNativeAuthorization(valid())).toMatchObject({
    redirectUri: 'picr://auth/callback',
  });
  for (const [key, value] of [
    ['redirect_uri', 'https://example.com/'],
    ['redirect_uri', 'picr://auth/callback/'],
    ['redirect_uri', 'picr://auth/callback?next=evil'],
    ['code_challenge_method', 'plain'],
    ['code_challenge', 'short'],
    ['state', 'short'],
  ]) {
    const params = valid();
    params.set(key, value);
    expect(parseNativeAuthorization(params)).toBeNull();
  }
  const duplicate = valid();
  duplicate.append('state', 'c'.repeat(43));
  expect(parseNativeAuthorization(duplicate)).toBeNull();
});
