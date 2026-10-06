import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Cada archivo de test usa su propia base SQLite en memoria.
    env: { NODE_ENV: "test", DB_PATH: ":memory:" },
  },
});
