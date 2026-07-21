import { Hono } from "hono";
import { loginPage } from "../../views/index.ts";
import { db } from "../../db/index.ts";
import Argon2id from "argon2id";
import { setCookie } from "hono/cookie";
import { type AppEnv } from "../types.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => c.html(loginPage()));

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE username = ?")
    .get(username) as { id: number; password_hash: string } | undefined;

  const valid = user
    ? await Argon2id.verify(user.password_hash, password)
    : false;
  if (!user || !valid) {
    return c.html(loginPage({ error: "Invalid username or password" }));
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  db.exec(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    token,
    user.id,
    expiresAt,
  );

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  db.exec("DELETE FROM sessions WHERE expires_at < datetime('now')");

  return c.redirect("/study");
});

export default app;
