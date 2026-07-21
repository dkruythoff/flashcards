import { Hono } from "hono";
import { type AppEnv } from "../types.ts";

export const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  if (!session) return c.redirect("/login");
  return c.redirect(session.role === "teacher" ? "/admin" : "/study");
});

export default app;
