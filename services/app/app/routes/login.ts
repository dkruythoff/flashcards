import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import Argon2id from "argon2id";
import { layout } from "@/views/index.ts";
import { db } from "@/db/index.ts";
import { type AppEnv } from "@/app/types.ts";
import { html } from "hono/html";
import { SESSION_INACTIVITY_DAYS } from "@/middleware/index.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");

  if (session) {
    return c.redirect(
      session ? (session.role === "teacher" ? "/admin" : "/study") : "/login",
    );
  }

  return c.html(viewLogin());
});

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
    return c.html(viewLogin({ error: "Invalid username or password" }));
  }

  const token = crypto.randomUUID();

  db.exec(
    `
    INSERT INTO
      sessions (token, user_id, expires_at)
      VALUES (?, ?, datetime('now', '+${SESSION_INACTIVITY_DAYS} days'))`,
    token,
    user.id,
  );

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_INACTIVITY_DAYS,
  });

  db.exec("DELETE FROM sessions WHERE expires_at < datetime('now')");

  return c.redirect("/study");
});

export default app;

export const viewLogin = (params?: { error?: string; username?: string }) =>
  layout({
    title: "Login",
    children: html` ${params?.error ? html`<div>${params.error}</div>` : ""}
      <form action="/login" method="POST">
        <label>
          <span>username</span>
          <input type="text" name="username" value="${params?.username}" />
        </label>
        <br />
        <label>
          <span>password</span>
          <input type="password" name="password" />
        </label>
        <br />
        <button type="submit">Log in</button>
      </form>`,
  });
