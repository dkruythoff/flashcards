import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { db } from "@/db/index.ts";
import { type AppEnv } from "@/app/types.ts";

export type SessionRole = "teacher" | "student";
export type Session = {
  role: SessionRole;
  token: string;
  userId: number;
  username: string;
};

export const SESSION_INACTIVITY_DAYS = 3;

export const attachSession = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token) {
    c.set("session", null);
    return next();
  }

  const row = db
    .prepare(
      "SELECT user_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime('now')",
    )
    .get<{ user_id: number; expires_at: string }>(token);

  if (!row) {
    c.set("session", null);
    return next();
  }

  const user = db
    .prepare("SELECT username, role FROM users WHERE id = ?")
    .get<{ username: string; role: SessionRole }>(row.user_id);
  if (!user) {
    c.set("session", null);
    return next();
  }

  db.exec(
    `
    UPDATE sessions
    SET expires_at = datetime('now', '+${SESSION_INACTIVITY_DAYS} days')
    WHERE token = ?
      AND expires_at > datetime('now')
      AND expires_at < datetime('now', '+${SESSION_INACTIVITY_DAYS - 1} days')`,
    token,
  );

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_INACTIVITY_DAYS,
  });

  c.set("session", {
    userId: row.user_id,
    role: user.role,
    username: user.username,
    token,
  });
  await next();
});

type AssertSession = (session: Session | null) => asserts session is Session;
export const assertSession: AssertSession = (session) => {
  if (!session)
    throw new Error("Expected an authenticated session, but none was present");
};
