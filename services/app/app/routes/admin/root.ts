import { Hono } from "hono";
import { AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import decks from "./decks.ts";
import students from "./students.ts";

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
app.route("/students", students);

export default app;
