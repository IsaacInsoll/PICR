import { createServer, type Server, type ServerResponse } from 'node:http';

export type PingHealthState = {
  fatalError?: string;
  permanentDeliveryError?: string;
  watcherReady: boolean;
};

const writeJson = (response: ServerResponse, status: number, body: object) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
};

export const startHealthServer = async (
  port: number,
  state: PingHealthState,
): Promise<Server> => {
  const server = createServer((request, response) => {
    if (request.url === '/healthz') {
      writeJson(response, 200, { status: 'ok' });
      return;
    }
    if (request.url === '/readyz') {
      const error = state.fatalError ?? state.permanentDeliveryError;
      const ready = state.watcherReady && !error;
      writeJson(response, ready ? 200 : 503, {
        status: ready ? 'ready' : 'not_ready',
        ...(error ? { error } : {}),
      });
      return;
    }
    writeJson(response, 404, { error: 'not_found' });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
};

export const closeHealthServer = async (server: Server) => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
};
