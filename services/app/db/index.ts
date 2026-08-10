import { Database } from "sqlite";

export const db = new Database("./data/flashcards.db");
db.exec("PRAGMA journal_mode=WAL");

export * as decks from "./decks.ts";
