import { config } from "dotenv";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Las pruebas de aislamiento hablan con una base de datos real; el resto no
// la necesita. Cargar .env.local aquí evita tener que pasar variables a mano.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // e2e/ es territorio de Playwright
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**"],
  },
  resolve: {
    alias: {
      // process.cwd() en vez de __dirname o import.meta.url: funciona igual
      // si Vite carga este archivo como CommonJS o como ESM.
      "@": `${process.cwd()}/src`,
      // Ver test/server-only-stub.ts.
      "server-only": `${process.cwd()}/test/server-only-stub.ts`,
    },
  },
});
