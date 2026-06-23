import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'electron': path.resolve(__dirname, './src/__mocks__/electron.js'),
    },
  },
  base: './',
  test: {
    environment: 'node',
    server: {
      deps: {
        inline: [
          /main\.js/
        ]
      }
    }
  },
});
