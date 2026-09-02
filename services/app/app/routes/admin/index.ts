import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import decks from "./decks/index.ts";
import users from "./users/index.ts";
import backup from "./backup.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: "Admin space",
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Admin",
    }),
  ),
);

app.route("/decks", decks);
app.route("/users", users);
app.route("/backup", backup);

export default app;
