import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  base: '/',
  plugins: [
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
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  },
  esbuild: { minifyIdentifiers: false }, //keep function names for easier debugging on production
  server: {
    port: 6969,
    proxy: {
      '/graphql': 'http://localhost:6900',
      '/image': 'http://localhost:6900',
      '/zip': 'http://localhost:6900',
    },
  },
});
