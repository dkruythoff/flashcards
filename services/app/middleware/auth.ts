import { createMiddleware } from "hono/factory";
import { type AppEnv } from "@/app/types.ts";
import type { SessionRole } from "@/middleware/session.ts";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("session")) return c.redirect("/login");
  await next();
});

export const requireRole = (role: SessionRole) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session");
    if (!session || session.role !== role) return c.redirect("/");
    await next();
  });
