import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import all from "./all.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => c.redirect(`${c.req.path}/all`));
app.route("/all", all);

export default app;
