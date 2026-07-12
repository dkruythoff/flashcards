import { Database } from "sqlite";

export function migrate(db: Database, migrationsDir: string) {
  const files = [...Deno.readDirSync(migrationsDir)]
    .filter((f) => f.isFile && f.name.endsWith(".sql"))
    .map((f) => f.name)
    .sort();

  const [currentVersion] = db.prepare("PRAGMA user_version").value<[number]>()!;

  for (const file of files) {
    const version = parseInt(file.split("_")[0], 10);
    if (version <= currentVersion) continue;

    const sql = Deno.readTextFileSync(`${migrationsDir}/${file}`);
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
      console.log(`Applied ${file}`);
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${err}`);
    }
  }
}
