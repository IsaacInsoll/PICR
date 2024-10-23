import { expect, test } from 'vitest';

test('Always Fails', async () => {
  // expect(1).toEqual(1);
  const response = await fetch('http://localhost:6900');
  const text = await response.text();
  // expect(text).toHaveLength(100);
});
