"use client";

import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, ClipboardCheck, X } from "lucide-react";
import { Response, Question } from "../../types";
import { formatDate, getQuestionTypeLabel } from "../../lib/utils";
import styles from "./results.module.css";

interface ResponseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: Response | null;
  responses: Response[];
  questions: Question[];
  submissionIndex: number;
  onNavigate: (response: Response, index: number) => void;
}

function answerFor(response: Response, questionId: number) {
  return response.answers?.find((a) => a.question_id === questionId);
}

function displayAnswer(
  ans: ReturnType<typeof answerFor>,
  type: Question["question_type"]
): { text: string; isBlank: boolean } {
  if (!ans) return { text: "No answer provided", isBlank: true };

  if (ans.boolean_value !== undefined && ans.boolean_value !== null) {
    return { text: ans.boolean_value ? "Yes" : "No", isBlank: false };
  }

  if (ans.number_value !== undefined && ans.number_value !== null) {
    if (type === "rating") {
      return { text: `${ans.number_value} / 5 Stars`, isBlank: false };
    }
    return { text: String(ans.number_value), isBlank: false };
  }

  if (ans.text_value !== undefined && ans.text_value !== null && ans.text_value.trim() !== "") {
    return { text: ans.text_value, isBlank: false };
  }

  return { text: "No answer provided", isBlank: true };
}

export const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  isOpen,
  onClose,
  response,
  responses,
  questions,
  submissionIndex,
  onNavigate,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !response) return null;

  const responsePosition = responses.findIndex(
    (item) => item.id === response.id
  );
  const previous = responsePosition > 0 ? responses[responsePosition - 1] : null;
  const next =
    responsePosition < responses.length - 1
      ? responses[responsePosition + 1]
      : null;

  return (
    <div
      className={styles.drawerBackdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className={styles.responseDrawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Response ${submissionIndex}`}
      >
        {/* Drawer Header */}
        <header className={styles.drawerHeader}>
          <div>
            <span className={styles.drawerSubmissionTag}>
              RESPONSE #{submissionIndex}
            </span>
            <h2 className={styles.drawerDateTitle}>
              {formatDate(response.submitted_at)}
            </h2>
          </div>
          <div className={styles.drawerActions}>
            <button
              type="button"
              disabled={!previous}
              onClick={() =>
                previous &&
                onNavigate(
                  previous,
                  responses.length - responses.indexOf(previous)
                )
              }
              aria-label="Previous response"
              title="Previous response"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() =>
                next &&
                onNavigate(next, responses.length - responses.indexOf(next))
              }
              aria-label="Next response"
              title="Next response"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close response drawer"
              title="Close"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {/* Drawer Body */}
        <div className={styles.drawerBody}>
          <div className={styles.responseStatusBadge}>
            <ClipboardCheck size={16} /> Completed response
          </div>

          {questions.map((question, index) => {
            const ans = answerFor(response, question.id);
            const { text, isBlank } = displayAnswer(
              ans,
              question.question_type
            );

            return (
              <article className={styles.responseAnswerItem} key={question.id}>
                <div className={styles.responseAnswerMeta}>
                  <span>{index + 1}</span>
                  {getQuestionTypeLabel(question.question_type)}
                </div>
                <h3 className={styles.responseAnswerQuestion}>
                  {question.title || "Untitled question"}
                </h3>
                <p
                  className={`${styles.responseAnswerValueBox} ${
                    isBlank ? styles.responseAnswerEmpty : ""
                  }`}
                >
                  {text}
                </p>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
};
