import "dotenv/config";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const [, , sqlPathArg] = process.argv;

if (!sqlPathArg) {
  console.error("Uso: node scripts/run-psql.js <caminho-do-sql>");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), sqlPathArg);
const conn = process.env.DATABASE_URL;

if (!conn) {
  console.error("DATABASE_URL não definido no ambiente (.env).");
  process.exit(1);
}

const child = spawn("psql", [conn, "-f", sqlPath], {
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => process.exit(code ?? 0));
