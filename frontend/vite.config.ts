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
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 6969,
    proxy: {
      '/graphql': 'http://localhost:6900',
      '/image': 'http://localhost:6900',
      '/zip': 'http://localhost:6900',
    },
  },
});
