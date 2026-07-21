import { db } from "./db/index.ts";
import { migrate } from "./db/migrate.ts";
import { app } from "./app/index.ts";

migrate(db, "./db/migrations");

Deno.serve({ port: 9000 }, app.fetch);
