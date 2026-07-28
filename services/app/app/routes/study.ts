import { Hono } from "hono";
import { AppEnv } from "../types.ts";
import { layout } from "../../views/index.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: "Study area",
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area",
    }),
  ),
);

export default app;
