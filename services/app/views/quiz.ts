import { html } from "hono/html";
import type { QuizState } from "@/db/quiz.ts";
import { type Context } from "hono";

export const quizView = ({
  c,
  isForm,
  quizState,
}: {
  c: Context;
  isForm: boolean;
  quizState: QuizState;
}) =>
  html`<div class="quiz">
    <p class="question" lang="es">${quizState.answer.front}</p>
    <div>
      ${optionListView({
        children: quizState.options.map((o) =>
          optionView({
            isForm,
            option: o,
            children: o.back.replaceAll("/", "/\u200B"),
          }),
        ),
        isForm,
        token: quizState.token,
      })}
    </div>
    ${!isForm &&
    html`<p class="quiz-row-next">
      <a href="${c.req.path}" class="button dark">Continue</a>
    </p>`}
  </div>`;

const optionListView = ({
  children,
  isForm,
  token,
}: {
  children: unknown;
  isForm: boolean;
  token?: string;
}) =>
  isForm
    ? html`<form method="POST" class="options">
        ${token && html`<input type="hidden" name="token" value="${token}" />`}
        ${children}
      </form>`
    : html`<div class="options">${children}</div>`;

const optionView = ({
  children,
  isForm,
  option,
}: {
  children: unknown;
  isForm: boolean;
  option: QuizState["options"][0];
}) =>
  isForm
    ? html`<button name="answer" value="${option.id}" class="option">
        ${children}
      </button>`
    : html`<p
        class="option ${[
          option.isAnswer ? "is-answer" : "",
          option.isCorrect ? "is-correct" : "",
          option.isWrong ? "is-wrong" : "",
        ]
          .filter((s) => !!s)
          .join(" ")}"
      >
        ${children}
      </p>`;
