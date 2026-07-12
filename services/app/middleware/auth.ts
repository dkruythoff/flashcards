import { createMiddleware } from "hono/factory";
import type { Session } from "./session.ts";

export const requireAuth = createMiddleware<{
  Variables: { session: Session | null };
}>(async (c, next) => {
  if (!c.get("session")) return c.redirect("/login");
  await next();
});
