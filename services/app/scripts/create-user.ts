import { Database } from "sqlite";
import Argon2id from "argon2id";

const db = new Database("./data/flashcards.db");

const username = prompt("Username:");
const password = prompt("Password:");
const role = prompt("Role (teacher/student):") ?? "student";

if (!username || !password) {
  console.error("Username and password are required");
  Deno.exit(1);
}

const passwordHash = await Argon2id.hashEncoded(password);

db.exec(
  "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
  username,
  passwordHash,
  role,
);

console.log(`Created ${role} '${username}'`);
db.close();
