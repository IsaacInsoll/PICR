import { expect, test } from 'vitest';

test('Express Server is Running', async () => {
  // expect(1).toEqual(1);
  const response = await fetch('http://localhost:6900');
  const text = await response.text();
  expect(text).toHaveLength(1091);
  expect(text.includes('<title>PICR</title>')).toBe(true);
  expect(text.includes('<div id="root"></div>')).toBe(true);
});
