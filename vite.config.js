import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    host: true,
    fs: {
      allow: ["C:/Users/ean/OneDrive/바탕 화면/WIPS", "C:/WIPS"],
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        search: resolve(__dirname, "search.html"),
        billing: resolve(__dirname, "billing.html"),
        nation: resolve(__dirname, "nation.html"),
      },
    },
  },
});
