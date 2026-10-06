import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../");
// DB_PATH permite usar otra base (p. ej. ":memory:" en los tests).
const dbPath = process.env.DB_PATH ?? path.join(repoRoot, "db", "padel.db");
const schemaPath = path.join(repoRoot, "db", "schema.sql");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = readFileSync(schemaPath, "utf-8");
db.exec(schema);
