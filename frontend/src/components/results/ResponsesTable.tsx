"use client";

import React, { useMemo, useState } from "react";
import { Response, Question } from "../../types";
import { formatDate } from "../../lib/utils";
import { ArrowDownUp, ClipboardCheck, Search, SlidersHorizontal } from "lucide-react";
import styles from "./results.module.css";

interface ResponsesTableProps {
  responses: Response[];
  questions: Question[];
  onViewDetails: (response: Response, index: number) => void;
}

function answerFor(response: Response, questionId: number): string {
  const ans = response.answers?.find((a) => a.question_id === questionId);
  if (!ans) return "—";
  if (ans.boolean_value !== undefined && ans.boolean_value !== null) {
    return ans.boolean_value ? "Yes" : "No";
  }
  if (ans.number_value !== undefined && ans.number_value !== null) {
    return String(ans.number_value);
  }
  if (ans.text_value !== undefined && ans.text_value !== null && ans.text_value.trim() !== "") {
    return ans.text_value;
  }
  return "—";
}

export const ResponsesTable: React.FC<ResponsesTableProps> = ({
  responses,
  questions,
  onViewDetails,
}) => {
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);

  const visibleResponses = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...responses]
      .filter(
        (response) =>
          !search ||
          questions.some((question) =>
            answerFor(response, question.id).toLowerCase().includes(search)
          )
      )
      .sort((a, b) => {
        const delta =
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime();
        return newestFirst ? delta : -delta;
      });
  }, [newestFirst, query, questions, responses]);

  if (responses.length === 0) {
    return (
      <div className={styles.resultsEmpty}>
        <ClipboardCheck size={32} style={{ color: "#0445af" }} />
        <h3>No responses yet</h3>
        <p>Share your public form to start collecting responses.</p>
      </div>
    );
  }

  return (
    <section className={styles.responsesPanel} aria-label="Form responses">
      {/* Toolbar */}
      <div className={styles.responsesToolbar}>
        <div className={styles.responsesSearch}>
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search responses..."
            aria-label="Search responses"
          />
        </div>
        <span className={styles.responsesCount}>
          {visibleResponses.length} of {responses.length} responses
        </span>
        <button
          type="button"
          className={styles.responsesSortBtn}
          onClick={() => setNewestFirst((v) => !v)}
          title="Toggle response date order"
        >
          <ArrowDownUp size={15} />
          <span>{newestFirst ? "Newest first" : "Oldest first"}</span>
        </button>
      </div>

      {/* Table Grid */}
      <div className={styles.responsesGridWrap}>
        <table className={styles.responsesGrid}>
          <thead>
            <tr>
              <th className={styles.responseLeadTh}>Response</th>
              {questions.map((question, index) => (
                <th key={question.id} title={question.title}>
                  <span className={styles.questionColNum}>{index + 1}</span>
                  <span>{question.title || "Untitled question"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleResponses.map((response) => {
              const submissionNumber =
                responses.length - responses.indexOf(response);
              return (
                <tr
                  key={response.id}
                  onClick={() => onViewDetails(response, submissionNumber)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      onViewDetails(response, submissionNumber);
                  }}
                >
                  <td className={styles.responseLeadTd}>
                    <span
                      className={styles.responseCheckbox}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>#{submissionNumber}</strong>
                      <small>{formatDate(response.submitted_at)}</small>
                    </div>
                  </td>
                  {questions.map((question) => (
                    <td
                      key={question.id}
                      title={answerFor(response, question.id)}
                    >
                      {answerFor(response, question.id)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleResponses.length === 0 && (
          <div className={styles.responsesNoMatch}>
            No responses match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </section>
  );
};
