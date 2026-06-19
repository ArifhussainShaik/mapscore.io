import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.js"],
    globals: true,
    testTimeout: 30000, // mongodb-memory-server first-download can be slow
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
