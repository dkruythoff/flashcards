import { createMiddleware } from "hono/factory";
import { type AppEnv } from "@/app/types.ts";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("session")) return c.redirect("/login");
  await next();
});
