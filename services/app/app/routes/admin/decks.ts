import { Hono } from "hono";
import { AppEnv } from "../../types.ts";
import { layout } from "../../../views/index.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: "Deck management",
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Admin: Decks",
    }),
  ),
);

export default app;
