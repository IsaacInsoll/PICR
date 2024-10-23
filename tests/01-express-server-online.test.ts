import { expect, test } from 'vitest';

test('Express Server is Running', async () => {
  const response = await fetch('http://localhost:6900');
  const text = await response.text();
  expect(text.includes('<title>PICR</title>')).toBe(true);
  expect(text.includes('<div id="root"></div>')).toBe(true);
});
