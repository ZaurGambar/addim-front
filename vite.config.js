import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

// Hər deploy-un öz versiyası: /data/* sorğularına ?v=... əlavə olunur ki, brauzer köhnə JSON göstərməsin.
// Netlify build zamanı COMMIT_REF verir; lokalda vaxt istifadə olunur.
const BUILD_ID = (process.env.COMMIT_REF || Date.now().toString(36)).slice(0, 12);

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
