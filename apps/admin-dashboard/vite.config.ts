import { defineConfig } from 'vite';
import honox from 'honox/vite';

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ['./app/global.ts']
      }
    })
  ],
  server: {
    port: 3000
  }
});