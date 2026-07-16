import http from 'node:http';

const port = process.env['PORT'] ?? '6900';
const request = http.get(
  {
    hostname: '127.0.0.1',
    path: '/readyz',
    port,
    timeout: 5_000,
  },
  (response) => {
    response.resume();
    process.exit(response.statusCode === 200 ? 0 : 1);
  },
);

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.on('error', () => {
  process.exit(1);
});
