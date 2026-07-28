import { Hono } from "hono";
import { AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: "Students management",
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Admin: Students",
    }),
  ),
);

export default app;
