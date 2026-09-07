"use client";

import React from "react";
import { Question, QuestionType, QuestionOption } from "../../types";
import styles from "./QuestionCanvas.module.css";

interface QuestionCanvasProps {
  selectedId: number | "thank_you" | "form_settings";
  questionIndex: number;
  activeQuestion: Question | null;
  onQuestionChange: (updated: Question) => void;
  onQuestionBlur: () => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, val: string) => void;
  onDeleteOption: (index: number) => void;
  thankYouTitle: string;
  thankYouMessage: string;
  onThankYouTitleChange: (val: string) => void;
  onThankYouMessageChange: (val: string) => void;
  onThankYouBlur: () => void;
  onAddFirstQuestion: () => void;
  totalQuestions: number;
}

export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({
  selectedId,
  questionIndex,
  activeQuestion,
  onQuestionChange,
  onQuestionBlur,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  thankYouTitle,
  thankYouMessage,
  onThankYouTitleChange,
  onThankYouMessageChange,
  onThankYouBlur,
  onAddFirstQuestion,
  totalQuestions,
}) => {
  // 1. Zero Questions State
  if (totalQuestions === 0 && selectedId !== "thank_you") {
    return (
      <section className={styles.canvasArea}>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✨</div>
          <h2 className={styles.emptyTitle}>Let&apos;s build your form</h2>
          <p className={styles.emptySubtitle}>
            Add your first question to get started.
          </p>
          <button className={styles.emptyAddBtn} onClick={onAddFirstQuestion}>
            + Add question
          </button>
        </div>
      </section>
    );
  }

  // 2. Thank You Screen
  if (selectedId === "thank_you") {
    return (
      <section className={styles.canvasArea}>
        <div className={styles.canvasCard}>
          <div className={styles.thankYouIcon}>🎉</div>
          <input
            type="text"
            className={styles.titleInput}
            value={thankYouTitle}
            onChange={(e) => onThankYouTitleChange(e.target.value)}
            onBlur={onThankYouBlur}
            placeholder="Thank you!"
          />
          <textarea
            className={styles.descInput}
            value={thankYouMessage}
            onChange={(e) => onThankYouMessageChange(e.target.value)}
            onBlur={onThankYouBlur}
            placeholder="Your submission has been received."
            rows={2}
          />
          <div className={styles.previewBtnRow}>
            <div className={styles.createAnotherPill}>Create a typeform</div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Question Canvas
  if (!activeQuestion) return null;

  return (
    <section className={styles.canvasArea}>
      <div className={styles.canvasCard}>
        {/* Question Header: Number + Asterisk + Title */}
        <div className={styles.questionHeaderRow}>
          <span className={styles.questionNumberLabel}>
            {questionIndex + 1}
            {activeQuestion.is_required && (
              <span className={styles.requiredStar}> *</span>
            )}
          </span>
          <input
            type="text"
            className={styles.titleInput}
            value={activeQuestion.title}
            onChange={(e) =>
              onQuestionChange({ ...activeQuestion, title: e.target.value })
            }
            onBlur={onQuestionBlur}
            placeholder="Your question here..."
          />
        </div>

        {/* Description / Help text */}
        <textarea
          className={styles.descInput}
          value={activeQuestion.description || ""}
          onChange={(e) =>
            onQuestionChange({ ...activeQuestion, description: e.target.value })
          }
          onBlur={onQuestionBlur}
          placeholder="Description (optional)"
          rows={1}
        />

        {/* Live Input Preview for 8 Question Types */}
        <div className={styles.inputPreviewArea}>
          {/* 1. Short Text */}
          {activeQuestion.question_type === QuestionType.short_text && (
            <div className={styles.previewFieldWrapper}>
              <input
                type="text"
                className={styles.shortTextInput}
                placeholder="Type your answer here..."
                disabled
              />
            </div>
          )}

          {/* 2. Long Text */}
          {activeQuestion.question_type === QuestionType.long_text && (
            <div className={styles.previewFieldWrapper}>
              <textarea
                className={styles.longTextTextarea}
                placeholder="Type your answer here..."
                disabled
                rows={3}
              />
            </div>
          )}

          {/* 3. Multiple Choice */}
          {activeQuestion.question_type === QuestionType.multiple_choice && (
            <div className={styles.choicesList}>
              {activeQuestion.options?.map((opt, idx) => (
                <div key={idx} className={styles.choiceCard}>
                  <span className={styles.choiceKey}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    className={styles.choiceInlineInput}
                    value={opt.value}
                    onChange={(e) => onUpdateOption(idx, e.target.value)}
                    onBlur={onQuestionBlur}
                    placeholder={`Choice ${idx + 1}`}
                  />
                  {activeQuestion.options && activeQuestion.options.length > 1 && (
                    <button
                      type="button"
                      className={styles.choiceDeleteBtn}
                      onClick={() => onDeleteOption(idx)}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.addChoiceBtn}
                onClick={onAddOption}
              >
                + Add choice
              </button>
            </div>
          )}

          {/* 4. Dropdown */}
          {activeQuestion.question_type === QuestionType.dropdown && (
            <div className={styles.dropdownWrapper}>
              <div className={styles.dropdownSelector}>
                <span>Select from dropdown...</span>
                <span>▼</span>
              </div>
              <div className={styles.dropdownOptionsList}>
                <span className={styles.dropdownListTitle}>Options:</span>
                {activeQuestion.options?.map((opt, idx) => (
                  <div key={idx} className={styles.choiceCard}>
                    <span className={styles.choiceKey}>{idx + 1}</span>
                    <input
                      type="text"
                      className={styles.choiceInlineInput}
                      value={opt.value}
                      onChange={(e) => onUpdateOption(idx, e.target.value)}
                      onBlur={onQuestionBlur}
                      placeholder={`Option ${idx + 1}`}
                    />
                    {activeQuestion.options && activeQuestion.options.length > 1 && (
                      <button
                        type="button"
                        className={styles.choiceDeleteBtn}
                        onClick={() => onDeleteOption(idx)}
                        title="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addChoiceBtn}
                  onClick={onAddOption}
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {/* 5. Email */}
          {activeQuestion.question_type === QuestionType.email && (
            <div className={styles.previewFieldWrapper}>
              <input
                type="email"
                className={styles.shortTextInput}
                placeholder="name@example.com"
                disabled
              />
            </div>
          )}

          {/* 6. Number */}
          {activeQuestion.question_type === QuestionType.number && (
            <div className={styles.previewFieldWrapper}>
              <input
                type="number"
                className={styles.shortTextInput}
                placeholder="0"
                disabled
              />
            </div>
          )}

          {/* 7. Yes / No */}
          {activeQuestion.question_type === QuestionType.yes_no && (
            <div className={styles.yesNoGroup}>
              <div className={styles.yesNoButton}>
                <span className={styles.choiceKey}>Y</span>
                <span>Yes</span>
              </div>
              <div className={styles.yesNoButton}>
                <span className={styles.choiceKey}>N</span>
                <span>No</span>
              </div>
            </div>
          )}

          {/* 8. Rating */}
          {activeQuestion.question_type === QuestionType.rating && (
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className={styles.ratingBtn}>
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom OK button mock preview */}
        <div className={styles.bottomOkRow}>
          <div className={styles.okButtonMock}>
            <span>OK</span>
            <span className={styles.okCheck}>✓</span>
          </div>
        </div>
      </div>
    </section>
  );
};
