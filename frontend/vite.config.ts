import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/graphql': 'http://localhost:6900',
      '/image': 'http://localhost:6900',
      '/zip': 'http://localhost:6900',
    },
  },
});
