import { html } from "hono/html";
import { type Session } from "../middleware/index.ts";

const layout = (props: { title: string; children?: unknown }) =>
  html`<!DOCTYPE html>
    <html>
      <head>
        <title>${props.title}</title>
      </head>
      <body>
        ${props.children}
      </body>
    </html>`;

export const loginPage = (params?: { error?: string; username?: string }) =>
  layout({
    title: "Login",
    children: html` ${params?.error ? html`<div>${params.error}</div>` : ""}
      <form action="/login" method="POST">
        <label>
          <span>username</span>
          <input type="text" name="username" value="${params?.username}" />
        </label>
        <br />
        <label>
          <span>password</span>
          <input type="password" name="password" />
        </label>
        <br />
        <button type="submit">Log in</button>
      </form>`,
  });

export const logoutPage = (params?: {
  session?: Session;
  error?: string;
  username?: string;
}) =>
  layout({
    title: "Login",
    children: html` ${params?.error ? html`<div>${params.error}</div>` : ""}
      <form action="/logout" method="POST">
        <p>
          logged in as ${params?.session?.username}<br /><button type="submit">
            Log out
          </button>
        </p>
      </form>`,
  });
