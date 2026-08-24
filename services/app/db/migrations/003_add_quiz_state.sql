CREATE TABLE quiz_state (
    question_token TEXT PRIMARY KEY,
    session_token TEXT NOT NULL REFERENCES sessions(token),
    card_id INTEGER NOT NULL REFERENCES cards(id),
    option_card_ids TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);