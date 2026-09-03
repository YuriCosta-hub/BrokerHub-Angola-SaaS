import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./index";

const sqlPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "sql",
  "0001_rls.sql",
);

const sql = await readFile(sqlPath, "utf8");
await pool.query(sql);
await pool.end();
console.log("Applied RLS policies from 0001_rls.sql");
