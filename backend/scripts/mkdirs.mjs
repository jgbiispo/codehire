import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dirs = [
  "db/migrations",
  "db/seeders",
  "../../scripts/sql"
];

for (const d of dirs) {
  const p = resolve(process.cwd(), d);
  mkdirSync(p, { recursive: true });
  console.log("ok:", p);
}
