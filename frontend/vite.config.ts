import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const picrIndexVarsDev = (env: Record<string, string>): Plugin => ({
  name: 'picr-index-vars-dev',
  transformIndexHtml(html) {
    const base = baseFromEnv(env.BASE_URL);
    return html.replace('{base}', base).replace('{title}', 'PICR');
  },
});

export default defineConfig(({ command, mode }) => {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(configDir, '..');
  const env = loadEnv(mode, repoRoot, '');
  const basePrefix = basePrefixFromEnv(env.BASE_URL);
  const proxy = {
    '/graphql': 'http://localhost:6900',
    '/image': 'http://localhost:6900',
    '/zip': 'http://localhost:6900',
    ...(basePrefix
      ? {
          [`${basePrefix}/graphql`]: 'http://localhost:6900',
          [`${basePrefix}/image`]: 'http://localhost:6900',
          [`${basePrefix}/zip`]: 'http://localhost:6900',
        }
      : {}),
  };
  return {
    base: command === 'build' ? './' : '/',
    plugins: [
      ...(command === 'serve' ? [picrIndexVarsDev(env)] : []),
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler', ReactCompilerConfig],
            [
              '@locator/babel-jsx/dist',
              {
                env: 'development',
              },
            ],
          ],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'jotai'],
      alias: {
        '@shared': path.resolve(repoRoot, 'shared'),
        // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
    build: {
      outDir: '../dist/public',
      emptyOutDir: true,
      rollupOptions: {
        external: [],
      },
    },
    esbuild: { minifyIdentifiers: false }, //keep function names for easier debugging on production
    server: {
      port: 6969,
      proxy,
    },
  };
});
