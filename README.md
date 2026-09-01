# Flashcards app

Extremely simple flashcards app for teaching words. Built to teach Spanish vocabulary, but usable for any kind of word/meaning training. A
teacher creates decks and assigns them to students; students review
them via spaced repetition (Leitner system) with multiple-choice
questions.

Runs on Deno with SQLite as the database. No client-side JS needed.

## Development

The entire ecosystem is orchestrated via Docker Compose.

To spin up the development environment:

`docker compose up`

The app will be available at `http://localhost:9000`.

On initial use, at least one teacher account should be added with:

`docker compose exec app deno task create-user`

## Production

`docker compose -f compose.yml -f compose.prod.yml up -d`

## Contributors
- [Darius Kruythoff](https://linkedin.com/in/dkruythoff)

## Development notes
Built with [Claude](https://claude.ai) as an AI pair programmer.