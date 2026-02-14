import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ["./app/global.ts"],
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
