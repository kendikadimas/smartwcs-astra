import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Test integrasi (src/test/db.ts) berbagi satu TEST_DATABASE_URL antar
    // file, masing-masing men-truncate semua tabel di beforeEach -- kalau
    // file test jalan paralel, truncate satu file menabrak test file lain
    // yang masih berjalan. Dijalankan sekuensial supaya tidak race.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
