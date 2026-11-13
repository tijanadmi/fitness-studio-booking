import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const directory = await mkdtemp(resolve(".local-postgres-"));
const database = new EmbeddedPostgres({
  databaseDir: directory,
  user: "postgres",
  password: "local-test-only",
  port: 55439,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});
try {
  await database.initialise();
  await database.start();
  await database.createDatabase("studio_test");
  const child = spawn(
    process.execPath,
    ["--test", "tests/database.integration.js"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        TEST_DATABASE_URL:
          "postgresql://postgres:local-test-only@localhost:55439/studio_test",
      },
    },
  );
  process.exitCode = await new Promise((res, rej) => {
    child.on("error", rej);
    child.on("exit", (code) => res(code || 0));
  });
} finally {
  await database.stop();
  console.log(
    "Lokalna test baza je zaustavljena. Podaci su u ignorisanom .local-postgres-* direktorijumu.",
  );
}
