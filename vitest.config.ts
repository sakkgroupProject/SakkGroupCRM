import { defineConfig } from "vitest/config"; import path from "path";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
export default defineConfig({ resolve:{ alias:{ "@": path.resolve(__dirname,"./src") } }, test:{ environment:"node" } });
