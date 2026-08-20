import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import { addUser, getUsers, type User, type UserRole } from "@/db/users.ts";
import { html, raw } from "hono/html";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: viewUsers({ users: getUsers() }),
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Admin: Users",
    }),
  ),
);

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;
  const role = body.role as UserRole;

  const errors = [];
  if (!username) errors.push("No username given");
  if (!password) errors.push("No password given");
  if (!["student", "teacher"].includes(role)) errors.push("Invalid role");

  if (!errors.length) {
    try {
      await addUser(username, password, role);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("UNIQUE constraint failed")
      ) {
        errors.push("Username already exists");
      } else {
        throw err;
      }
    }
  }

  if (errors.length) {
    return c.html(
      layout({
        children: viewUsers({
          addUserParams: { username, role, errors },
          users: getUsers(),
        }),
        navigation: c.get("nav"),
        session: c.get("session"),
        title: "Admin: Users",
      }),
    );
  }

  return c.redirect(c.req.path);
});

export default app;

const viewUsers = ({
  addUserParams = {},
  users,
}: {
  addUserParams?: AddUserParams;
  users: User[];
}) =>
  html`<h2>Existing users</h2>
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>username</th>
          <th>type</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(
          (user) =>
            html`<tr>
              <td>${user.id}</td>
              <td>${user.username}</td>
              <td>${user.role}</td>
            </tr>`,
        )}
      </tbody>
    </table>
    ${raw(viewAddUser(addUserParams))}`;

type AddUserParams = {
  errors?: string[];
  username?: string;
  role?: UserRole;
};
const viewAddUser = ({
  errors = [],
  role = "student",
  username = "",
}: AddUserParams) =>
  html`<h2>Add users</h2>
    ${errors?.length
      ? html`<ul>
          ${errors.map((error) => html`<li>${error}</li>`)}
        </ul>`
      : ""}
    <form method="POST">
      <span>
        <span>role</span>
        <label>
          <input
            type="radio"
            name="role"
            value="student"
            ${role !== "teacher" ? "checked" : ""}
          />
          <span>student</span>
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="teacher"
            ${role === "teacher" ? "checked" : ""}
          />
          <span>teacher</span>
        </label>
      </span>
      <br />
      <label>
        <span>username</span>
        <input type="text" name="username" value="${username}" />
      </label>
      <br />
      <label>
        <span>password</span>
        <input type="password" name="password" />
      </label>
      <br />
      <button type="submit">Save</button>
    </form>`;
