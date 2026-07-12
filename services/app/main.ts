import { db } from "./db/index.ts";
import { migrate } from "./db/migrate.ts";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import Argon2id from "argon2id";
import { loginPage, logoutPage } from "./views/index.ts";
import {
  attachSession,
  requireAuth,
  type Session,
} from "./middleware/index.ts";

migrate(db, "./db/migrations");

const app = new Hono<{ Variables: { session: Session | null } }>();

app.use(csrf());
app.use(attachSession);
app.use("/study/*", requireAuth);

app.get("/", (c) => {
  const session = c.get("session");
  return c.html(session ? logoutPage({ session }) : loginPage());
});

app.get("/login", (c) => c.html(loginPage()));

app.post("/login", async (c) => {
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
  const csrfToken = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  db.exec(
    "INSERT INTO sessions (token, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)",
    token,
    user.id,
    csrfToken,
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

app.post("/logout", (c) => {
  const token = getCookie(c, "session");
  if (token) db.exec("DELETE FROM sessions WHERE token = ?", token);
  deleteCookie(c, "session");
  return c.redirect("/login");
});

Deno.serve({ port: 9000 }, app.fetch);
