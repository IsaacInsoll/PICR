import { expect, test } from 'vitest';
import { testUrl } from './testSetup';

test('Express Server is Running', async () => {
  const response = await fetch(testUrl);
  const text = await response.text();
  expect(text.includes('<title>PICR</title>')).toBe(true);
  expect(text.includes('<div id="root"></div>')).toBe(true);
});
