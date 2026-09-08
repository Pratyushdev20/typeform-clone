"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { fetcher } from "../../lib/api";
import { Form, Question, QuestionType } from "../../types";
import styles from "./PublicFormRunner.module.css";

interface AnswerState {
  text_value?: string;
  number_value?: number;
  boolean_value?: boolean;
}

interface PublicFormRunnerProps {
  slug: string;
}

export const PublicFormRunner: React.FC<PublicFormRunnerProps> = ({ slug }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Flow states: "welcome" | number (0-based index of question) | "thank_you"
  const [currentStep, setCurrentStep] = useState<"welcome" | number | "thank_you">("welcome");
  const [historyStack, setHistoryStack] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Load public form from backend
  useEffect(() => {
    if (!slug) return;
    const fetchForm = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data: Form = await fetcher(`/public/forms/${slug}`);
        setForm(data);
      } catch (err: any) {
        console.error("Failed to load public form:", err);
        setLoadError(
          err.message || "This form is unavailable, private, or does not exist."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  // Focus input automatically whenever step changes
  useEffect(() => {
    if (typeof currentStep === "number") {
      setValidationError(null);
      setSubmitError(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentStep]);

  // Calculate estimated completion time
  const estimatedTimeText = useMemo(() => {
    const count = form?.questions?.length || 0;
    if (count === 0) return "Takes 30 seconds";
    if (count === 1) return "Takes 1 minute";
    if (count <= 3) return "Takes 1 minute 30 seconds";
    if (count <= 5) return "Takes 2 minutes";
    const mins = Math.ceil(count * 0.35);
    return `Takes ~${mins} minutes`;
  }, [form?.questions?.length]);

  // Helper to get answer for a question
  const getAnswer = (questionId: number): AnswerState => {
    return answers[questionId] || {};
  };

  // Helper to update answer
  const updateAnswer = (questionId: number, update: Partial<AnswerState>) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...update,
      },
    }));
  };

  // Client-side validation for current question
  const validateCurrentQuestion = (question: Question, explicitAns?: AnswerState): boolean => {
    const ans = explicitAns || getAnswer(question.id);
    const hasText = ans.text_value !== undefined && ans.text_value.trim() !== "";
    const hasNumber = ans.number_value !== undefined && !isNaN(ans.number_value);
    const hasBool = ans.boolean_value !== undefined;

    const hasAnyValue = hasText || hasNumber || hasBool;

    if (question.is_required && !hasAnyValue) {
      setValidationError("Please fill out this required question.");
      return false;
    }

    if (!hasAnyValue) return true; // Optional & empty is valid

    // Email format validation
    if (question.question_type === QuestionType.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!ans.text_value || !emailRegex.test(ans.text_value.trim())) {
        setValidationError("Please enter a valid email address.");
        return false;
      }
    }

    // Number validation
    if (question.question_type === QuestionType.number) {
      if (ans.number_value === undefined || isNaN(ans.number_value)) {
        setValidationError("Please enter a valid number.");
        return false;
      }
    }

    return true;
  };

  // Helper to find matching logic rule based on respondent answer
  const findMatchingRule = (question: Question, ans: AnswerState) => {
    if (!question.logic_rules || question.logic_rules.length === 0) return undefined;

    let currentVal = "";
    if (question.question_type === QuestionType.yes_no) {
      if (ans.boolean_value === true || ans.text_value?.toLowerCase() === "yes") currentVal = "yes";
      else if (ans.boolean_value === false || ans.text_value?.toLowerCase() === "no") currentVal = "no";
    } else if (question.question_type === QuestionType.rating) {
      if (ans.number_value !== undefined) currentVal = ans.number_value.toString();
      else if (ans.text_value) currentVal = ans.text_value.trim();
    } else {
      currentVal = (ans.text_value || "").trim();
    }

    if (!currentVal) return undefined;

    return question.logic_rules.find(
      (rule) => rule.condition_value.trim().toLowerCase() === currentVal.toLowerCase()
    );
  };

  // Move to Next Question or Submit
  const handleNext = async (explicit?: { questionId: number; answer: AnswerState }) => {
    if (!form || !form.questions) return;

    if (currentStep === "welcome") {
      if (form.questions.length > 0) {
        setHistoryStack([]);
        setCurrentStep(0);
      } else {
        setCurrentStep("thank_you");
      }
      return;
    }

    if (typeof currentStep === "number") {
      const currentQ = form.questions[currentStep];
      const currentAns =
        explicit && explicit.questionId === currentQ.id
          ? explicit.answer
          : getAnswer(currentQ.id);

      if (!validateCurrentQuestion(currentQ, currentAns)) {
        return;
      }

      // Check conditional logic rule
      const rule = findMatchingRule(currentQ, currentAns);

      if (rule) {
        if (rule.action === "end") {
          await handleSubmit(currentQ.id, currentAns);
          return;
        }

        if (rule.action === "jump" && rule.destination_question_id) {
          const destIdx = form.questions.findIndex(
            (q) => q.id === rule.destination_question_id
          );
          if (destIdx !== -1 && destIdx !== currentStep) {
            setHistoryStack((prev) => [...prev, currentStep]);
            setCurrentStep(destIdx);
            return;
          }
        }
      }

      // Default progression
      if (currentStep < form.questions.length - 1) {
        setHistoryStack((prev) => [...prev, currentStep]);
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit(currentQ.id, currentAns);
      }
    }
  };

  // Move to Previous Question (following the history stack)
  const handlePrev = () => {
    if (!form || !form.questions) return;
    if (typeof currentStep === "number") {
      if (historyStack.length > 0) {
        const prevIndex = historyStack[historyStack.length - 1];
        setHistoryStack((prev) => prev.slice(0, -1));
        setCurrentStep(prevIndex);
      } else {
        setCurrentStep("welcome");
      }
    }
  };

  // Submit responses to backend (submitting only answered questions)
  const handleSubmit = async (lastQId?: number, lastAns?: AnswerState) => {
    if (!form || !form.questions) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const mergedAnswers = {
        ...answers,
        ...(lastQId && lastAns ? { [lastQId]: lastAns } : {}),
      };

      const payloadAnswers = form.questions
        .filter((q) => {
          const ans = mergedAnswers[q.id];
          if (!ans) return false;
          const hasText = ans.text_value !== undefined && ans.text_value !== null && ans.text_value.trim() !== "";
          const hasNumber = ans.number_value !== undefined && ans.number_value !== null && !isNaN(ans.number_value);
          const hasBool = ans.boolean_value !== undefined && ans.boolean_value !== null;
          return hasText || hasNumber || hasBool;
        })
        .map((q) => {
          const ans = mergedAnswers[q.id];
          return {
            question_id: q.id,
            text_value: ans.text_value ?? null,
            number_value: ans.number_value ?? null,
            boolean_value: ans.boolean_value ?? null,
          };
        });

      await fetcher(`/public/forms/${slug}/responses`, {
        method: "POST",
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      setCurrentStep("thank_you");
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      // Welcome Screen: Enter starts flow
      if (currentStep === "welcome") {
        if (e.key === "Enter") {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Inside a Question step:
      if (typeof currentStep === "number" && form?.questions) {
        const currentQ = form.questions[currentStep];

        // Long text: only advance if Ctrl+Enter or Cmd+Enter
        if (currentQ.question_type === QuestionType.long_text) {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleNext();
          }
          return;
        }

        // Enter key advances
        if (e.key === "Enter") {
          e.preventDefault();
          handleNext();
          return;
        }

        // Multiple choice hotkeys (A, B, C...)
        if (
          currentQ.question_type === QuestionType.multiple_choice &&
          currentQ.options &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          const keyUpper = e.key.toUpperCase();
          const charCode = keyUpper.charCodeAt(0);
          if (keyUpper.length === 1 && charCode >= 65 && charCode <= 90) {
            const optIndex = charCode - 65;
            if (optIndex >= 0 && optIndex < currentQ.options.length) {
              const selectedOpt = currentQ.options[optIndex];
              const updatedAns = { text_value: selectedOpt.value };
              updateAnswer(currentQ.id, updatedAns);
              setTimeout(() => handleNext({ questionId: currentQ.id, answer: updatedAns }), 150);
            }
          }
        }

        // Yes / No hotkeys (Y / N)
        if (currentQ.question_type === QuestionType.yes_no) {
          if (e.key.toLowerCase() === "y") {
            const updatedAns = { boolean_value: true, text_value: "yes" };
            updateAnswer(currentQ.id, updatedAns);
            setTimeout(() => handleNext({ questionId: currentQ.id, answer: updatedAns }), 150);
          } else if (e.key.toLowerCase() === "n") {
            const updatedAns = { boolean_value: false, text_value: "no" };
            updateAnswer(currentQ.id, updatedAns);
            setTimeout(() => handleNext({ questionId: currentQ.id, answer: updatedAns }), 150);
          }
        }

        // Rating hotkeys (1-5)
        if (currentQ.question_type === QuestionType.rating) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= 10) {
            const updatedAns = { number_value: num, text_value: num.toString() };
            updateAnswer(currentQ.id, updatedAns);
            setTimeout(() => handleNext({ questionId: currentQ.id, answer: updatedAns }), 150);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, form, answers, isSubmitting]);

  // Loading State
  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.loadingSpinner} />
        <p style={{ color: "#6b7280", marginTop: "1rem", fontSize: "1rem" }}>
          Loading form...
        </p>
      </div>
    );
  }

  // Error State (Unpublished / 404 / Network)
  if (loadError || !form) {
    return (
      <div className={styles.centerContainer}>
        <div style={{ fontSize: "2.5rem" }}>🔒</div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#191919" }}>
          Form Unavailable
        </h2>
        <p style={{ color: "#6b7280", maxWidth: "450px", lineHeight: 1.5 }}>
          {loadError || "This form is either unpublished, private, or does not exist."}
        </p>
        <Link
          href="/dashboard"
          style={{
            marginTop: "1rem",
            padding: "0.65rem 1.4rem",
            background: "#262627",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Go to Workspace
        </Link>
      </div>
    );
  }

  const totalQuestions = form.questions?.length || 0;
  const progressPercent =
    currentStep === "welcome"
      ? 0
      : currentStep === "thank_you"
      ? 100
      : typeof currentStep === "number" && totalQuestions > 0
      ? Math.round(((currentStep + 1) / totalQuestions) * 100)
      : 0;

  return (
    <div className={styles.pageContainer}>
      {/* Top Progress Bar */}
      <div className={styles.progressBarTrack}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <main className={styles.mainContent}>
        {/* ===================================================
            SCREEN 1: WELCOME / START SCREEN (Screenshot 3)
            =================================================== */}
        {currentStep === "welcome" && (
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>{form.title}</h1>
            {form.description && (
              <p className={styles.welcomeDesc}>{form.description}</p>
            )}
            <div className={styles.welcomeActionArea}>
              <button
                type="button"
                className={styles.getStartedBtn}
                onClick={() => handleNext()}
                autoFocus
              >
                Get Started
              </button>
              {totalQuestions > 0 && (
                <span className={styles.estimateTime}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {estimatedTimeText}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            SCREEN 2: QUESTION FLOW (Screenshot 2)
            =================================================== */}
        {typeof currentStep === "number" && form.questions && form.questions[currentStep] && (
          (() => {
            const q = form.questions[currentStep];
            const ans = getAnswer(q.id);
            const isLast = currentStep === totalQuestions - 1;

            return (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.questionHeaderRow}>
                  <span className={styles.questionNumberBadge}>
                    {currentStep + 1}
                  </span>
                  <div className={styles.questionTitleWrapper}>
                    <h2 className={styles.questionTitle}>
                      {q.title}
                      {q.is_required && (
                        <span className={styles.requiredAsterisk}>*</span>
                      )}
                    </h2>
                    {q.description && (
                      <p className={styles.questionDesc}>{q.description}</p>
                    )}
                  </div>
                </div>

                <div className={styles.inputArea}>
                  {/* 1. Short Text */}
                  {q.question_type === QuestionType.short_text && (
                    <input
                      ref={inputRef as any}
                      type="text"
                      className={styles.underlineInput}
                      value={ans.text_value || ""}
                      onChange={(e) =>
                        updateAnswer(q.id, { text_value: e.target.value })
                      }
                      placeholder="Type your answer here..."
                    />
                  )}

                  {/* 2. Long Text */}
                  {q.question_type === QuestionType.long_text && (
                    <textarea
                      ref={inputRef as any}
                      className={styles.textareaInput}
                      value={ans.text_value || ""}
                      onChange={(e) =>
                        updateAnswer(q.id, { text_value: e.target.value })
                      }
                      placeholder="Type your answer here..."
                    />
                  )}

                  {/* 3. Email */}
                  {q.question_type === QuestionType.email && (
                    <input
                      ref={inputRef as any}
                      type="email"
                      className={styles.underlineInput}
                      value={ans.text_value || ""}
                      onChange={(e) =>
                        updateAnswer(q.id, { text_value: e.target.value })
                      }
                      placeholder="name@example.com"
                    />
                  )}

                  {/* 4. Number */}
                  {q.question_type === QuestionType.number && (
                    <input
                      ref={inputRef as any}
                      type="number"
                      className={styles.underlineInput}
                      value={ans.number_value !== undefined ? ans.number_value : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAnswer(q.id, {
                          number_value: val === "" ? undefined : parseFloat(val),
                          text_value: val,
                        });
                      }}
                      placeholder="0"
                    />
                  )}

                  {/* 5. Multiple Choice */}
                  {q.question_type === QuestionType.multiple_choice && (
                    <div className={styles.choicesList}>
                      {q.options?.map((opt, idx) => {
                        const isSelected = ans.text_value === opt.value;
                        const keyLetter = String.fromCharCode(65 + idx);
                        return (
                          <div
                            key={opt.id || idx}
                            className={`${styles.choiceCard} ${
                              isSelected ? styles.choiceCardSelected : ""
                            }`}
                            onClick={() => {
                              const updated = { text_value: opt.value };
                              updateAnswer(q.id, updated);
                              setTimeout(
                                () =>
                                  handleNext({
                                    questionId: q.id,
                                    answer: { ...ans, ...updated },
                                  }),
                                150
                              );
                            }}
                          >
                            <span className={styles.keyBadge}>{keyLetter}</span>
                            <span>{opt.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 6. Dropdown */}
                  {q.question_type === QuestionType.dropdown && (
                    <select
                      className={styles.selectInput}
                      value={ans.text_value || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { text_value: val };
                        updateAnswer(q.id, updated);
                      }}
                    >
                      <option value="">Select an option...</option>
                      {q.options?.map((opt, idx) => (
                        <option key={opt.id || idx} value={opt.value}>
                          {opt.value}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 7. Yes / No */}
                  {q.question_type === QuestionType.yes_no && (
                    <div className={styles.yesNoRow}>
                      <button
                        type="button"
                        className={`${styles.yesNoBtn} ${
                          ans.boolean_value === true ? styles.yesNoBtnSelected : ""
                        }`}
                        onClick={() => {
                          const updated = { boolean_value: true, text_value: "yes" };
                          updateAnswer(q.id, updated);
                          setTimeout(
                            () =>
                              handleNext({
                                questionId: q.id,
                                answer: { ...ans, ...updated },
                              }),
                            150
                          );
                        }}
                      >
                        <span className={styles.keyBadge}>Y</span>
                        <span>Yes</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.yesNoBtn} ${
                          ans.boolean_value === false ? styles.yesNoBtnSelected : ""
                        }`}
                        onClick={() => {
                          const updated = { boolean_value: false, text_value: "no" };
                          updateAnswer(q.id, updated);
                          setTimeout(
                            () =>
                              handleNext({
                                questionId: q.id,
                                answer: { ...ans, ...updated },
                              }),
                            150
                          );
                        }}
                      >
                        <span className={styles.keyBadge}>N</span>
                        <span>No</span>
                      </button>
                    </div>
                  )}

                  {/* 8. Rating */}
                  {q.question_type === QuestionType.rating && (
                    <div className={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = ans.number_value === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            className={`${styles.ratingBtn} ${
                              isSelected ? styles.ratingBtnSelected : ""
                            }`}
                            onClick={() => {
                              const updated = {
                                number_value: num,
                                text_value: num.toString(),
                              };
                              updateAnswer(q.id, updated);
                              setTimeout(
                                () =>
                                  handleNext({
                                    questionId: q.id,
                                    answer: { ...ans, ...updated },
                                  }),
                                150
                              );
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Validation and submission errors */}
                {validationError && (
                  <div className={styles.errorText}>
                    <span>⚠️</span> {validationError}
                  </div>
                )}
                {submitError && (
                  <div className={styles.errorText}>
                    <span>⚠️</span> {submitError}
                  </div>
                )}

                {/* Action Area: OK / Submit */}
                <div className={styles.actionArea}>
                  <button
                    type="button"
                    className={styles.okBtn}
                    onClick={() => handleNext()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : isLast
                      ? "Submit"
                      : "OK"}
                  </button>

                  <span className={styles.enterHint}>
                    press <strong>Enter ↵</strong>
                    {q.question_type === QuestionType.long_text && " (Ctrl+Enter for multiline)"}
                  </span>
                </div>
              </div>
            );
          })()
        )}

        {/* ===================================================
            SCREEN 3: THANK YOU SCREEN (Screenshot 1)
            =================================================== */}
        {currentStep === "thank_you" && (
          <div className={styles.thankYouCard}>
            <div className={styles.checkmarkCircle}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#262627" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 className={styles.thankYouTitle}>
              {form.thank_you_title || "Thanks for completing this form"}
            </h1>
            <p className={styles.thankYouDesc}>
              {form.thank_you_message ? (
                form.thank_you_message
              ) : (
                <>
                  Now <strong>create your own</strong> — it&apos;s free, easy &amp; beautiful
                </>
              )}
            </p>
            <div className={styles.thankYouActionArea}>
              <Link href="/dashboard" className={styles.createTypeformBtn}>
                Create a form
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Chevrons (Bottom-Right) */}
      <footer className={styles.floatingFooter}>
        <div className={styles.navChevronsGroup}>
          <button
            type="button"
            className={styles.navChevronBtn}
            onClick={handlePrev}
            disabled={currentStep === "welcome" || currentStep === "thank_you" || isSubmitting}
            title="Previous question (Up arrow)"
            aria-label="Previous question"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <div className={styles.navChevronDivider} />
          <button
            type="button"
            className={styles.navChevronBtn}
            onClick={() => handleNext()}
            disabled={currentStep === "thank_you" || isSubmitting}
            title="Next question (Down arrow)"
            aria-label="Next question"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </footer>

      {/* Bottom Progress Counter (e.g. "1 / 4") */}
      {typeof currentStep === "number" && (
        <div className={styles.bottomProgressIndicator}>
          {currentStep + 1} / {totalQuestions}
        </div>
      )}
    </div>
  );
};
