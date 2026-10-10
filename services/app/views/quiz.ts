import { html } from "hono/html";
import type { QuizState } from "@/db/quiz.ts";

export const quizView = ({
  answered,
  currentPath,
  quizState,
}: {
  answered: boolean;
  currentPath: string;
  quizState: QuizState;
}) =>
  answered
    ? quizViewAnswer({ currentPath, quizState })
    : quizViewQuestion({ quizState });

const quizViewQuestion = ({ quizState }: { quizState: QuizState }) =>
  html`<div class="quiz">
    <p class="question" lang="es">${quizState.answer.front}</p>
    <div>
      <form method="POST" class="options">
        <input type="hidden" name="token" value="${quizState.token}" />
        ${quizState.options.map(
          (o) =>
            html`<button name="answer" value="${o.id}" class="option">
              ${o.back}
            </button>`,
        )}
      </form>
    </div>
  </div>`;

const quizViewAnswer = ({
  currentPath,
  quizState,
}: {
  currentPath: string;
  quizState: QuizState;
}) =>
  html`<div class="quiz">
    <p class="question" lang="es">${quizState.answer.front}</p>
    <div>
      <div class="options">
        ${quizState.options.map((o) => {
          return html`<p
            class="option ${[
              o.isAnswer ? "is-answer" : "",
              o.isCorrect ? "is-correct" : "",
              o.isWrong ? "is-wrong" : "",
            ]
              .filter((s) => !!s)
              .join(" ")}"
          >
            ${o.back}
          </p>`;
        })}
      </div>
    </div>
    <p class="quiz-row-next">
      <a href="${currentPath}" class="button dark">Continue</a>
    </p>
  </div>`;
