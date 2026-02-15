import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["app/api/**/*.test.ts"],
    exclude: ["**/node_modules/**", "tests/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["app/api/**/*.ts", "services/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  }
});
