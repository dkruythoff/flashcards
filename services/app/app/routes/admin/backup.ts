import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { db } from "@/db/index.ts";

const app = new Hono<AppEnv>();

app.get("/", async () => {
  const tempPath = `./data/backup-${Date.now()}.db`;

  try {
    db.exec("VACUUM INTO ?", tempPath);
    const bytes = await Deno.readFile(tempPath);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="flashcards-${new Date().toISOString().slice(0, 10)}.db"`,
      },
    });
  } finally {
    await Deno.remove(tempPath).catch(() => {});
  }
});

export default app;
