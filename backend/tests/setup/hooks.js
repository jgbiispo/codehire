import * as dotenv from "dotenv";
import { execSync } from "node:child_process";

before(async function () {
  process.env.NODE_ENV = "test";

  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.test" });

  process.env.API_PREFIX = process.env.API_PREFIX || "/";

  process.env.AUTH_ACCESS_TOKEN_SECRET = process.env.AUTH_ACCESS_TOKEN_SECRET || "test-access-secret";
  process.env.AUTH_REFRESH_TOKEN_SECRET = process.env.AUTH_REFRESH_TOKEN_SECRET || "test-refresh-secret";

  execSync("pnpm db:migrate", { stdio: "ignore" });
  execSync("pnpm db:seed", { stdio: "ignore" });
});

after(async function () {
  try {
    execSync("pnpm db:seed:undo", { stdio: "ignore" });
  } catch { }

  try {
    const { sequelize } = await import("../../src/db/sequelize.js");
    await sequelize.close();
  } catch { }
});
