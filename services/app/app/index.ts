import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { attachSession, requireAuth } from "../middleware/index.ts";
import { login, logout, root } from "./routes/index.ts";
import { type AppEnv } from "./types.ts";

export const app = new Hono<AppEnv>();

app.use(csrf());
app.use(attachSession);
app.use("/study/*", requireAuth);
app.use("/admin/*", requireAuth);

app.route("/", root);
app.route("/login", login);
app.route("/logout", logout);
