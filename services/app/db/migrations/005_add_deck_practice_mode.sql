ALTER TABLE answers ADD COLUMN answer_type TEXT NOT NULL DEFAULT 'study' CHECK (answer_type IN ('study', 'practice'));

CREATE TABLE deck_practice (
    session_token TEXT NOT NULL REFERENCES sessions(token),
    deck_id INTEGER NOT NULL REFERENCES decks(id),
    remaining_card_ids TEXT NOT NULL, -- JSON list, shuffled once at round start, shrinks per draw
    answer_ids TEXT NOT NULL DEFAULT '[]', -- JSON list of answer ids given in this practice round
    pending TEXT, -- JSON: { cardId: number; optionIds: number[] } | null
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (session_token, deck_id)
)