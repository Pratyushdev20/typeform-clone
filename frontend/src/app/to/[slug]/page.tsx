"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetcher } from "../../../lib/api";
import { Form, Question, QuestionType } from "../../../types";
import styles from "./respondent.module.css";

interface AnswerState {
  text_value?: string;
  number_value?: number;
  boolean_value?: boolean;
}

export default function PublicFormRunner() {
  const params = useParams();
  const slug = params?.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Flow states: "welcome" | number (0-based index of current question) | "thank_you"
  const [currentStep, setCurrentStep] = useState<"welcome" | number | "thank_you">("welcome");
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPublicForm = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data: Form = await fetcher(`/public/forms/${slug}`);
        setForm(data);
      } catch (err: any) {
        console.error("Failed to load public form:", err);
        setLoadError(
          err.message || "This form is private, unpublished, or does not exist."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicForm();
  }, [slug]);

  // Focus input automatically whenever current question step changes
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

  // Client-side validation for the current question
  const validateCurrentQuestion = (question: Question): boolean => {
    const ans = getAnswer(question.id);
    const hasText = ans.text_value !== undefined && ans.text_value.trim() !== "";
    const hasNumber = ans.number_value !== undefined && !isNaN(ans.number_value);
    const hasBool = ans.boolean_value !== undefined;

    const hasAnyValue = hasText || hasNumber || hasBool;

    if (question.is_required && !hasAnyValue) {
      setValidationError("Please fill out this required question.");
      return false;
    }

    if (!hasAnyValue) return true; // Optional and empty is valid

    // Email validation
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

  // Move to Next Question or Submit
  const handleNext = async () => {
    if (!form || !form.questions) return;

    if (currentStep === "welcome") {
      if (form.questions.length > 0) {
        setCurrentStep(0);
      } else {
        setCurrentStep("thank_you");
      }
      return;
    }

    if (typeof currentStep === "number") {
      const currentQ = form.questions[currentStep];
      if (!validateCurrentQuestion(currentQ)) {
        return;
      }

      if (currentStep < form.questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Last question: Submit answers
        await handleSubmit();
      }
    }
  };

  // Move to Previous Question
  const handlePrev = () => {
    if (!form || !form.questions) return;
    if (typeof currentStep === "number") {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      } else {
        setCurrentStep("welcome");
      }
    }
  };

  // Submit all responses to backend
  const handleSubmit = async () => {
    if (!form || !form.questions) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        answers: form.questions.map((q) => {
          const ans = getAnswer(q.id);
          return {
            question_id: q.id,
            text_value: ans.text_value ?? null,
            number_value: ans.number_value ?? null,
            boolean_value: ans.boolean_value ?? null,
          };
        }),
      };

      await fetcher(`/public/forms/${slug}/responses`, {
        method: "POST",
        body: JSON.stringify(payload),
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
      // Don't intercept when modal or submitting
      if (isSubmitting) return;

      // Welcome Screen: Enter starts form
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

        // If in textarea (long_text), only advance if Ctrl+Enter or Cmd+Enter
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
              updateAnswer(currentQ.id, { text_value: selectedOpt.value });
              setTimeout(() => handleNext(), 150);
            }
          }
        }

        // Yes / No hotkeys (Y / N)
        if (currentQ.question_type === QuestionType.yes_no) {
          if (e.key.toLowerCase() === "y") {
            updateAnswer(currentQ.id, { boolean_value: true, text_value: "yes" });
            setTimeout(() => handleNext(), 150);
          } else if (e.key.toLowerCase() === "n") {
            updateAnswer(currentQ.id, { boolean_value: false, text_value: "no" });
            setTimeout(() => handleNext(), 150);
          }
        }

        // Rating hotkeys (1, 2, 3, 4, 5...)
        if (currentQ.question_type === QuestionType.rating) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= 10) {
            updateAnswer(currentQ.id, { number_value: num, text_value: num.toString() });
            setTimeout(() => handleNext(), 150);
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
        <div style={{ fontSize: "1.75rem", fontWeight: 500 }}>Loading form...</div>
        <p style={{ color: "var(--muted)" }}>Getting questions ready</p>
      </div>
    );
  }

  // Error State (Unpublished / 404 / Network)
  if (loadError || !form) {
    return (
      <div className={styles.centerContainer}>
        <div style={{ fontSize: "2.5rem" }}>🔒</div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Form Unavailable</h2>
        <p style={{ color: "var(--muted)", maxWidth: "450px" }}>
          {loadError || "This form is either unpublished, private, or does not exist."}
        </p>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Go to Homepage
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
        {/* 1. WELCOME SCREEN */}
        {currentStep === "welcome" && (
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>{form.title}</h1>
            {form.description && (
              <p className={styles.welcomeDesc}>{form.description}</p>
            )}
            <div className={styles.actionArea} style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={handleNext}
                autoFocus
              >
                Start Form
              </button>
              <span className={styles.enterHint}>
                press <strong>Enter ↵</strong>
              </span>
            </div>
          </div>
        )}

        {/* 2. QUESTION SCREEN */}
        {typeof currentStep === "number" && form.questions && form.questions[currentStep] && (
          (() => {
            const q = form.questions[currentStep];
            const ans = getAnswer(q.id);
            const isLast = currentStep === totalQuestions - 1;

            return (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.stepHeader}>
                  <span>{currentStep + 1}</span>
                  <span>→</span>
                  {q.is_required && <span className={styles.requiredTag}>* required</span>}
                </div>

                <h2 className={styles.questionTitle}>{q.title}</h2>
                {q.description && <p className={styles.questionDesc}>{q.description}</p>}

                <div className={styles.inputArea}>
                  {/* Short Text */}
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

                  {/* Long Text */}
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

                  {/* Email */}
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

                  {/* Number */}
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

                  {/* Multiple Choice */}
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
                              updateAnswer(q.id, { text_value: opt.value });
                              setTimeout(() => handleNext(), 150);
                            }}
                          >
                            <span className={styles.keyBadge}>{keyLetter}</span>
                            <span>{opt.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown */}
                  {q.question_type === QuestionType.dropdown && (
                    <select
                      className={styles.selectInput}
                      value={ans.text_value || ""}
                      onChange={(e) => {
                        updateAnswer(q.id, { text_value: e.target.value });
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

                  {/* Yes / No */}
                  {q.question_type === QuestionType.yes_no && (
                    <div className={styles.yesNoRow}>
                      <button
                        type="button"
                        className={`${styles.yesNoBtn} ${
                          ans.boolean_value === true ? styles.yesNoBtnSelected : ""
                        }`}
                        onClick={() => {
                          updateAnswer(q.id, { boolean_value: true, text_value: "yes" });
                          setTimeout(() => handleNext(), 150);
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
                          updateAnswer(q.id, { boolean_value: false, text_value: "no" });
                          setTimeout(() => handleNext(), 150);
                        }}
                      >
                        <span className={styles.keyBadge}>N</span>
                        <span>No</span>
                      </button>
                    </div>
                  )}

                  {/* Rating */}
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
                              updateAnswer(q.id, {
                                number_value: num,
                                text_value: num.toString(),
                              });
                              setTimeout(() => handleNext(), 150);
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Validation Error Message */}
                {validationError && (
                  <div className={styles.errorText}>
                    <span>⚠️</span> {validationError}
                  </div>
                )}

                {/* Backend Submission Error Message */}
                {submitError && (
                  <div className={styles.errorText}>
                    <span>⚠️</span> {submitError}
                  </div>
                )}

                {/* Action Button Area */}
                <div className={styles.actionArea}>
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : isLast
                      ? "Submit ↵"
                      : "OK ✓"}
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

        {/* 3. THANK YOU SCREEN */}
        {currentStep === "thank_you" && (
          <div className={styles.thankYouCard}>
            <div className={styles.celebrateIcon}>🎉</div>
            <h1 className={styles.thankYouTitle}>
              {form.thank_you_title || "Thank you!"}
            </h1>
            <p className={styles.thankYouDesc}>
              {form.thank_you_message || "Your response has been recorded."}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation Chevrons */}
      {typeof currentStep === "number" && (
        <footer className={styles.bottomNav}>
          <div className={styles.bottomNavLeft}>
            {currentStep + 1} of {totalQuestions} answered
          </div>
          <div className={styles.navChevrons}>
            <button
              type="button"
              className={styles.navChevronBtn}
              onClick={handlePrev}
              title="Previous question (Up arrow)"
            >
              ▲
            </button>
            <button
              type="button"
              className={styles.navChevronBtn}
              onClick={handleNext}
              title="Next question (Down arrow)"
            >
              ▼
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
