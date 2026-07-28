import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { db } from "../db/index.ts";
import { AppEnv } from "../app/types.ts";

export type SessionRole = "teacher" | "student";
export type Session = {
  username: string;
  userId: number;
  role: SessionRole;
};

export const attachSession = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token) {
    c.set("session", null);
    return next();
  }

  const row = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
    .get(token) as
    | {
        user_id: number;
        expires_at: string;
      }
    | undefined;

  if (!row || new Date(row.expires_at) < new Date()) {
    c.set("session", null);
    return next();
  }

  const user = db
    .prepare("SELECT username, role FROM users WHERE id = ?")
    .get(row.user_id) as { username: string; role: SessionRole };

  if (!user) {
    c.set("session", null);
    return next();
  }

  c.set("session", {
    userId: row.user_id,
    role: user.role,
    username: user.username,
  });
  await next();
});
