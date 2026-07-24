import {
  defineConfig,
  loadEnv,
  type Plugin,
  type ProxyOptions,
  type ViteDevServer,
} from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import { Kind, parse } from 'graphql';

// https://vitejs.dev/config/

const ReactCompilerConfig = {
  /* ... */
};

const baseFromEnv = (rawBaseUrl?: string) => {
  if (!rawBaseUrl) return '/';
  try {
    const url = new URL(rawBaseUrl);
    return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  } catch {
    return rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;
  }
};

const basePrefixFromEnv = (rawBaseUrl?: string) => {
  const base = baseFromEnv(rawBaseUrl);
  return base === '/' ? '' : base.replace(/\/$/, '');
};

const devBackendOverrideEnv = 'VITE_PICR_DEV_BACKEND_URL';

const normalizeBackendUrl = (rawBackendUrl?: string) => {
  if (!rawBackendUrl) return null;
  const trimmed = rawBackendUrl.trim();
  if (!trimmed) return null;

  const url = new URL(trimmed);
  if (url.pathname !== '/' && !url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`;
  }
  url.search = '';
  url.hash = '';
  return url;
};

const stripBasePrefix = (requestPath: string, basePrefix: string) => {
  if (!basePrefix) return requestPath;
  if (requestPath === basePrefix) return '/';
  if (requestPath.startsWith(`${basePrefix}/`)) {
    return requestPath.slice(basePrefix.length);
  }
  return requestPath;
};

const proxyTargetFromUrl = (backendUrl: URL) => backendUrl.origin;

const backendBasePrefixFromUrl = (backendUrl: URL) => {
  const pathname = backendUrl.pathname;
  if (!pathname || pathname === '/') return '';
  return pathname.replace(/\/$/, '');
};

const rewriteToBackendPath =
  (localBasePrefix: string, backendBasePrefix: string) =>
  (requestPath: string) =>
    `${backendBasePrefix}${stripBasePrefix(requestPath, localBasePrefix)}`;

const backendProxyEntry = (
  backendUrl: URL,
  localBasePrefix: string,
): ProxyOptions => {
  const backendBasePrefix = backendBasePrefixFromUrl(backendUrl);
  return {
    target: proxyTargetFromUrl(backendUrl),
    changeOrigin: true,
    rewrite: rewriteToBackendPath(localBasePrefix, backendBasePrefix),
  };
};

const backendProxy = (
  backendUrl: URL,
  basePrefix: string,
  includeGraphql: boolean,
) => {
  const routes = includeGraphql
    ? ['/graphql', '/image', '/zip']
    : ['/image', '/zip'];
  const proxy: Record<string, ProxyOptions> = Object.fromEntries(
    routes.map((route) => [route, backendProxyEntry(backendUrl, '')]),
  );

  if (basePrefix) {
    Object.assign(
      proxy,
      Object.fromEntries(
        routes.map((route) => [
          `${basePrefix}${route}`,
          backendProxyEntry(backendUrl, basePrefix),
        ]),
      ),
    );
  }

  return proxy;
};

const readRequestBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const headerValue = (
  headers: IncomingHttpHeaders,
  name: string,
): string | undefined => {
  const value = headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
};

type GraphqlRequestPolicy = 'allow' | 'block' | 'unknown';

const graphqlRequestPolicy = (
  query: unknown,
  operationName?: unknown,
): GraphqlRequestPolicy => {
  if (typeof query !== 'string') return 'unknown';

  try {
    const parsed = parse(query);
    const operations = parsed.definitions.filter(
      (definition) => definition.kind === Kind.OPERATION_DEFINITION,
    );
    if (typeof operationName === 'string' && operationName) {
      const operation = operations.find(
        (definition) => definition.name?.value === operationName,
      );
      if (!operation) return 'unknown';
      if (operation.operation !== 'mutation') return 'allow';
      return operation.selectionSet.selections.every(
        (selection) =>
          selection.kind === Kind.FIELD && selection.name.value === 'auth',
      )
        ? 'allow'
        : 'block';
    }

    return operations.some((operation) => {
      if (operation.operation !== 'mutation') return false;
      return !operation.selectionSet.selections.every(
        (selection) =>
          selection.kind === Kind.FIELD && selection.name.value === 'auth',
      );
    })
      ? 'block'
      : 'allow';
  } catch {
    return /^\s*mutation\b/i.test(query) ? 'block' : 'allow';
  }
};

const isMutationPayload = (body: string, contentType: string | undefined) => {
  if (contentType?.includes('application/json')) {
    let payload: unknown;
    try {
      payload = JSON.parse(body) as unknown;
    } catch {
      return true;
    }

    const operations = Array.isArray(payload) ? payload : [payload];
    return operations.some((operation) => {
      if (
        operation === null ||
        typeof operation !== 'object' ||
        !('query' in operation)
      ) {
        return true;
      }
      const policy = graphqlRequestPolicy(
        operation.query,
        'operationName' in operation ? operation.operationName : undefined,
      );
      return policy !== 'allow';
    });
  }

  return graphqlRequestPolicy(body) !== 'allow';
};

const createDevBackendOverridePlugin = (
  backendUrl: URL | null,
  basePrefix: string,
): Plugin => ({
  name: 'picr-dev-backend-override',
  configureServer(server: ViteDevServer) {
    if (!backendUrl) return;

    const backendBasePrefix = backendBasePrefixFromUrl(backendUrl);
    const graphqlPaths = new Set([
      '/graphql',
      ...(basePrefix ? [`${basePrefix}/graphql`] : []),
    ]);

    server.middlewares.use(async (req, res, next) => {
      const rawUrl = req.url ?? '';
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      if (!graphqlPaths.has(parsedUrl.pathname)) {
        next();
        return;
      }

      try {
        const requestPath = stripBasePrefix(parsedUrl.pathname, basePrefix);
        const targetUrl = new URL(
          `${backendBasePrefix}${requestPath}${parsedUrl.search}`,
          backendUrl.origin,
        );
        const headers = new Headers();
        Object.entries(req.headers).forEach(([name, value]) => {
          if (value == null) return;
          if (
            ['connection', 'content-length', 'host'].includes(
              name.toLowerCase(),
            )
          ) {
            return;
          }
          if (Array.isArray(value)) {
            value.forEach((entry) => headers.append(name, entry));
          } else {
            headers.set(name, value);
          }
        });

        let body: string | undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          body = await readRequestBody(req);
          const contentType = headerValue(req.headers, 'content-type');
          if (isMutationPayload(body, contentType)) {
            res.statusCode = 403;
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({
                errors: [
                  {
                    message:
                      'Blocked GraphQL mutation because VITE_PICR_DEV_BACKEND_URL is read-only.',
                  },
                ],
              }),
            );
            return;
          }
        } else {
          const query = parsedUrl.searchParams.get('query');
          const operationName = parsedUrl.searchParams.get('operationName');
          if (graphqlRequestPolicy(query, operationName) !== 'allow') {
            res.statusCode = 403;
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({
                errors: [
                  {
                    message:
                      'Blocked GraphQL mutation because VITE_PICR_DEV_BACKEND_URL is read-only.',
                  },
                ],
              }),
            );
            return;
          }
        }

        const response = await fetch(targetUrl, {
          method: req.method,
          headers,
          body,
          redirect: 'manual',
        });

        res.statusCode = response.status;
        response.headers.forEach((value, name) => {
          if (
            [
              'content-encoding',
              'content-length',
              'transfer-encoding',
            ].includes(name.toLowerCase())
          ) {
            return;
          }
          res.setHeader(name, value);
        });
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        next(error);
      }
    });
  },
});

export const picrIndexVarsDev = (env: Record<string, string>): Plugin => ({
  name: 'picr-index-vars-dev',
  transformIndexHtml(html) {
    const base = baseFromEnv(env.BASE_URL);
    const devBackendOverrideUrl = normalizeBackendUrl(
      env[devBackendOverrideEnv],
    );
    const devBackendOverrideScript = devBackendOverrideUrl
      ? `<script>window.__PICR_DEV_BACKEND_URL__=${JSON.stringify(devBackendOverrideUrl.href).replaceAll('<', '\\u003c')};</script>`
      : '';
    return (
      html
        .replace('{base}', base)
        .replace('{title}', 'PICR')
        // The Vite dev server only runs for local development, which is a dev
        // environment by definition, so always use the beta logo favicon here.
        .replace('{favicon}', 'favicon-beta.png')
        .replace('</head>', `${devBackendOverrideScript}</head>`)
    );
  },
});

export default defineConfig(async ({ command, mode }) => {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(configDir, '..');
  const env = loadEnv(mode, repoRoot, '');
  const basePrefix = basePrefixFromEnv(env.BASE_URL);
  const devBackendOverrideUrl =
    command === 'serve'
      ? normalizeBackendUrl(env[devBackendOverrideEnv])
      : null;
  const backendUrl =
    devBackendOverrideUrl ??
    normalizeBackendUrl(`http://localhost:6900${basePrefix}/`);
  if (!backendUrl) {
    throw new Error('PICR frontend backend URL could not be resolved');
  }
  const proxy = backendProxy(backendUrl, basePrefix, !devBackendOverrideUrl);
  return {
    base: command === 'build' ? './' : '/',
    plugins: [
      ...(command === 'serve' ? [picrIndexVarsDev(env)] : []),
      ...(command === 'serve'
        ? [createDevBackendOverridePlugin(devBackendOverrideUrl, basePrefix)]
        : []),
      await babel({
        presets: [reactCompilerPreset(ReactCompilerConfig)],
        plugins: [['@locator/babel-jsx/dist', { env: 'development' }]],
      }),
      react(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'jotai'],
      alias: [
        {
          find: '@shared',
          replacement: path.resolve(repoRoot, 'shared'),
        },
        {
          // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
          find: '@tabler/icons-react',
          replacement: '@tabler/icons-react/dist/esm/icons/index.mjs',
        },
      ],
    },
    build: {
      outDir: '../dist/public',
      emptyOutDir: true,
      rolldownOptions: {
        external: [],
        output: {
          keepNames: true,
        },
      },
    },
    server: {
      port: 6969,
      proxy,
    },
  };
});
