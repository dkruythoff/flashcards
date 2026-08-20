import { db } from "@/db/index.ts";
import Argon2id from "argon2id";

export type UserRole = "teacher" | "student";

export type User = {
  id: number;
  username: string;
  role: UserRole;
};

export const getUsers = () =>
  (db.prepare("SELECT id, username, role FROM users").all() as
    | User[]
    | undefined) || [];

export const getUser = (id: number) =>
  db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(id) as
    | User
    | undefined;

export const addUser = async (
  username: string,
  password: string,
  role: UserRole,
) => {
  const passwordHash = await Argon2id.hashEncoded(password);
  db.exec(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
    username,
    passwordHash,
    role,
  );
};
