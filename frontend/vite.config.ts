import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from "vite-plugin-tsconfig-paths"

// https://vitejs.dev/config/

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  base: '/',
  plugins: [
    tsConfigPaths(),
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
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      external:[],
    }
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
