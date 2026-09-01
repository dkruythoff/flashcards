import { Database } from "sqlite";

export const db = new Database("./data/flashcards.db");
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys = ON");

export * as decks from "./decks.ts";
