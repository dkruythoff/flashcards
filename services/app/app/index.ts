import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { attachNav, attachSession, requireAuth } from "@/middleware/index.ts";
import { admin, login, logout, study } from "./routes/index.ts";
import { type AppEnv } from "./types.ts";

export const app = new Hono<AppEnv>();

app.use(csrf());
app.use(attachSession);
app.use(attachNav);
app.use("/study/*", requireAuth);
app.use("/admin/*", requireAuth);

app.get("/", (c) => {
  const session = c.get("session");
  return c.redirect(
    session ? (session.role === "teacher" ? "/admin" : "/study") : "/login",
  );
});

app.route("/login", login);
app.route("/logout", logout);
app.route("/admin", admin);
app.route("/study", study);
