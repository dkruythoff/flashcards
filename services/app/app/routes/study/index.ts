import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { default as decks } from "./decks/index.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => c.redirect(`${c.req.path}/decks`));
app.route("/decks", decks);

export default app;
