import { expect, test } from 'vitest';

import request from 'supertest';

test('Express Server is Running', () => {
  request('http://localhost:6900')
    .get('/')
    .expect(200)
    .expect((res) => {
      expect(res.text).toHaveLength(1067);
    })
    .end(function (err, res) {
      if (err) throw err;
    });
});
