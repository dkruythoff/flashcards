import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { db } from "../../db/index.ts";
import { type AppEnv } from "../types.ts";

const app = new Hono<AppEnv>();

app.post("/", (c) => {
  const token = getCookie(c, "session");
  if (token) db.exec("DELETE FROM sessions WHERE token = ?", token);
  deleteCookie(c, "session");
  return c.redirect("/login");
});

export default app;
