import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./index";

const sqlDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "sql");
const files = (await readdir(sqlDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const name of files) {
  const sql = await readFile(path.join(sqlDir, name), "utf8");
  await pool.query(sql);
  console.log(`Applied ${name}`);
}

await pool.end();
