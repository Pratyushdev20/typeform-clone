"use client";

import React, { useState, useEffect } from "react";
import { Form, QuestionType, Question } from "../../types";
import styles from "./BuilderPreviewModal.module.css";

interface BuilderPreviewModalProps {
  form: Form;
  isOpen: boolean;
  onClose: () => void;
  thankYouTitle: string;
  thankYouMessage: string;
}

export const BuilderPreviewModal: React.FC<BuilderPreviewModalProps> = ({
  form,
  isOpen,
  onClose,
  thankYouTitle,
  thankYouMessage,
}) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const questions = form.questions || [];
  const currentQuestion: Question | undefined = questions[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setIsCompleted(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (currentQuestion) {
      const val = answers[currentQuestion.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "");

      if (currentQuestion.is_required && isEmpty) {
        setErrorMsg("Please fill out this field");
        return;
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (isCompleted) {
      setIsCompleted(false);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsCompleted(false);
    setErrorMsg(null);
  };

  const progress =
    questions.length > 0
      ? isCompleted
        ? 100
        : Math.round(((currentIndex + 1) / questions.length) * 100)
      : 100;

  return (
    <div className={styles.previewOverlay}>
      {/* Top Floating Control Bar */}
      <div className={styles.topControlBar}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          title="Exit Preview"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.deviceToggleGroup}>
          <button
            className={`${styles.deviceBtn} ${device === "desktop" ? styles.deviceBtnActive : ""}`}
            onClick={() => setDevice("desktop")}
            title="Desktop View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>
          <button
            className={`${styles.deviceBtn} ${device === "mobile" ? styles.deviceBtnActive : ""}`}
            onClick={() => setDevice("mobile")}
            title="Mobile View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </button>
        </div>

        <button
          className={styles.restartBtn}
          onClick={handleRestart}
          title="Restart Preview"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Main Viewport Container */}
      <div className={styles.viewportContainer}>
        <div
          className={`${styles.frame} ${
            device === "mobile" ? styles.frameMobile : styles.frameDesktop
          }`}
        >
          {/* Progress Bar */}
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={styles.contentBody}>
            {isCompleted ? (
              /* Thank You Screen */
              <div className={styles.thankYouContainer}>
                <div className={styles.thankYouIcon}>🎉</div>
                <h1 className={styles.thankYouHeading}>
                  {thankYouTitle || "Thank you!"}
                </h1>
                <p className={styles.thankYouMessage}>
                  {thankYouMessage || "Your response has been recorded."}
                </p>
                <button className={styles.restartFormBtn} onClick={handleRestart}>
                  Submit another response
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div className={styles.noQuestionsState}>
                <h2>No questions added yet</h2>
                <p>Add questions in the builder to preview the respondent flow.</p>
              </div>
            ) : currentQuestion ? (
              /* Question Slide */
              <div className={styles.slide}>
                <div className={styles.questionNumberRow}>
                  <span>{currentIndex + 1}</span>
                  <span>→</span>
                  {currentQuestion.is_required && (
                    <span className={styles.requiredLabel}>* required</span>
                  )}
                </div>

                <h2 className={styles.questionTitle}>
                  {currentQuestion.title || "Question title"}
                </h2>

                {currentQuestion.description && (
                  <p className={styles.questionDescription}>
                    {currentQuestion.description}
                  </p>
                )}

                {/* Input components */}
                <div className={styles.inputWrapper}>
                  {currentQuestion.question_type === QuestionType.short_text && (
                    <input
                      type="text"
                      className={styles.underlineInput}
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      autoFocus
                    />
                  )}

                  {currentQuestion.question_type === QuestionType.long_text && (
                    <textarea
                      className={styles.textareaInput}
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      rows={3}
                      autoFocus
                    />
                  )}

                  {currentQuestion.question_type === QuestionType.email && (
                    <input
                      type="email"
                      className={styles.underlineInput}
                      placeholder="name@example.com"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      autoFocus
                    />
                  )}

                  {currentQuestion.question_type === QuestionType.number && (
                    <input
                      type="number"
                      className={styles.underlineInput}
                      placeholder="0"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      autoFocus
                    />
                  )}

                  {currentQuestion.question_type === QuestionType.multiple_choice && (
                    <div className={styles.choicesList}>
                      {currentQuestion.options?.map((opt, idx) => {
                        const isSelected = answers[currentQuestion.id] === opt.value;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`${styles.choiceBtn} ${
                              isSelected ? styles.choiceBtnSelected : ""
                            }`}
                            onClick={() => {
                              setAnswers({
                                ...answers,
                                [currentQuestion.id]: opt.value,
                              });
                            }}
                          >
                            <span className={styles.choiceKeyBadge}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt.value || `Option ${idx + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.question_type === QuestionType.dropdown && (
                    <select
                      className={styles.selectInput}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                    >
                      <option value="">Select an option...</option>
                      {currentQuestion.options?.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                          {opt.value}
                        </option>
                      ))}
                    </select>
                  )}

                  {currentQuestion.question_type === QuestionType.yes_no && (
                    <div className={styles.yesNoList}>
                      {["Yes", "No"].map((choice, idx) => {
                        const isSelected = answers[currentQuestion.id] === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            className={`${styles.choiceBtn} ${
                              isSelected ? styles.choiceBtnSelected : ""
                            }`}
                            onClick={() => {
                              setAnswers({
                                ...answers,
                                [currentQuestion.id]: choice,
                              });
                            }}
                          >
                            <span className={styles.choiceKeyBadge}>
                              {idx === 0 ? "Y" : "N"}
                            </span>
                            <span>{choice}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.question_type === QuestionType.rating && (
                    <div className={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = answers[currentQuestion.id] === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            className={`${styles.ratingBtn} ${
                              isSelected ? styles.ratingBtnSelected : ""
                            }`}
                            onClick={() => {
                              setAnswers({
                                ...answers,
                                [currentQuestion.id]: num,
                              });
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {errorMsg && <p className={styles.errorMsg}>⚠ {errorMsg}</p>}

                {/* OK Action Button */}
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.okBtn}
                    onClick={handleNext}
                  >
                    <span>{currentIndex === questions.length - 1 ? "Submit" : "OK"}</span>
                    <span className={styles.okIcon}>✓</span>
                  </button>
                  <span className={styles.pressEnterHint}>press Enter ↵</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Navigation Arrows at bottom right */}
          <div className={styles.navArrows}>
            <button
              className={styles.arrowBtn}
              onClick={handlePrev}
              disabled={currentIndex === 0 && !isCompleted}
              title="Previous question"
            >
              ▲
            </button>
            <button
              className={styles.arrowBtn}
              onClick={handleNext}
              disabled={isCompleted}
              title="Next question"
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
