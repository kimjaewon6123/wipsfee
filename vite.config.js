import { defineConfig } from "vite";

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
        index: "index.html",
        search: "search.html",
        billing: "billing.html",
        nation: "nation.html",
      },
    },
  },
});
