"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { fetcher } from "../../../lib/api";
import { Form, Question, QuestionType, QuestionOption } from "../../../types";
import { SortableQuestionItem } from "./SortableQuestionItem";
import styles from "./builder.module.css";

const QUESTION_TYPE_CONFIG: Record<
  QuestionType,
  { label: string; icon: string; defaultTitle: string }
> = {
  [QuestionType.short_text]: {
    label: "Short Text",
    icon: "📝",
    defaultTitle: "What is your answer?",
  },
  [QuestionType.long_text]: {
    label: "Long Text",
    icon: "📄",
    defaultTitle: "Please provide your detailed thoughts.",
  },
  [QuestionType.multiple_choice]: {
    label: "Multiple Choice",
    icon: "🔘",
    defaultTitle: "Choose an option:",
  },
  [QuestionType.dropdown]: {
    label: "Dropdown",
    icon: "🔽",
    defaultTitle: "Select from the list:",
  },
  [QuestionType.email]: {
    label: "Email",
    icon: "✉️",
    defaultTitle: "What is your email address?",
  },
  [QuestionType.number]: {
    label: "Number",
    icon: "#️⃣",
    defaultTitle: "Please enter a number:",
  },
  [QuestionType.yes_no]: {
    label: "Yes / No",
    icon: "👍",
    defaultTitle: "Do you agree?",
  },
  [QuestionType.rating]: {
    label: "Rating",
    icon: "⭐",
    defaultTitle: "How would you rate your experience?",
  },
};

export default function FormBuilder() {
  const params = useParams();
  const formId = params?.id as string;
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Selected item: null or number ID for a question, or "thank_you" / "form_settings"
  const [selectedId, setSelectedId] = useState<number | "thank_you" | "form_settings">("form_settings");

  // Add question modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active question editing form state
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Form metadata editing state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [thankYouTitle, setThankYouTitle] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState("");

  // Drag and drop state and sensors
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadForm = async () => {
    if (!formId) return;
    try {
      setLoading(true);
      setError(null);
      const data: Form = await fetcher(`/forms/${formId}`);
      setForm(data);
      setFormTitle(data.title || "");
      setFormDesc(data.description || "");
      setThankYouTitle(data.thank_you_title || "Thank you!");
      setThankYouMessage(data.thank_you_message || "Your response has been recorded.");

      if (data.questions && data.questions.length > 0) {
        setSelectedId(data.questions[0].id);
        setActiveQuestion({ ...data.questions[0] });
      } else {
        setSelectedId("form_settings");
      }
    } catch (err: any) {
      console.error("Failed to load form:", err);
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [formId]);

  // When selectedId changes to a question ID, sync activeQuestion state
  useEffect(() => {
    if (typeof selectedId === "number" && form?.questions) {
      const q = form.questions.find((item) => item.id === selectedId);
      if (q) {
        setActiveQuestion({ ...q, options: q.options ? [...q.options] : [] });
      }
    }
  }, [selectedId, form]);

  const showSaveBadge = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // 1. Update Form general settings
  const handleSaveFormSettings = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const updated = await fetcher(`/forms/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          thank_you_title: thankYouTitle,
          thank_you_message: thankYouMessage,
        }),
      });
      setForm({ ...form, ...updated });
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to save form settings", err);
      alert("Failed to save form settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 2. Publish / Unpublish Toggle
  const handleTogglePublish = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const updated = await fetcher(`/forms/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          is_published: !form.is_published,
        }),
      });
      setForm({ ...form, is_published: updated.is_published });
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to toggle publish status", err);
      alert("Failed to toggle publish: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Add Question
  const handleAddQuestion = async (type: QuestionType) => {
    if (!form) return;
    setIsAddModalOpen(false);

    const config = QUESTION_TYPE_CONFIG[type];
    const initialOptions =
      type === QuestionType.multiple_choice || type === QuestionType.dropdown
        ? [{ value: "Option 1", order_index: 0 }, { value: "Option 2", order_index: 1 }]
        : [];

    try {
      setSaving(true);
      const newQuestion: Question = await fetcher(`/forms/${form.id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          title: config.defaultTitle,
          description: "",
          question_type: type,
          is_required: false,
          options: initialOptions,
        }),
      });

      const updatedQuestions = [...(form.questions || []), newQuestion];
      setForm({ ...form, questions: updatedQuestions });
      setSelectedId(newQuestion.id);
      setActiveQuestion(newQuestion);
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to add question", err);
      alert("Failed to add question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Save Question Changes
  const handleSaveActiveQuestion = async (updatedQ: Question) => {
    if (!form || !updatedQ) return;
    try {
      setSaving(true);
      const res: Question = await fetcher(`/questions/${updatedQ.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: updatedQ.title,
          description: updatedQ.description,
          question_type: updatedQ.question_type,
          is_required: updatedQ.is_required,
          options: updatedQ.options
            ? updatedQ.options.map((opt, idx) => ({
                id: opt.id,
                value: opt.value,
                order_index: idx,
              }))
            : [],
        }),
      });

      // Update question list in state
      const updatedList = form.questions.map((q) => (q.id === res.id ? res : q));
      setForm({ ...form, questions: updatedList });
      setActiveQuestion(res);
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to save question", err);
      alert("Failed to save question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Question
  const handleDeleteQuestion = async (questionId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!form) return;
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      setSaving(true);
      await fetcher(`/questions/${questionId}`, {
        method: "DELETE",
      });

      const updatedList = form.questions.filter((q) => q.id !== questionId);
      setForm({ ...form, questions: updatedList });

      if (selectedId === questionId) {
        if (updatedList.length > 0) {
          setSelectedId(updatedList[0].id);
        } else {
          setSelectedId("form_settings");
        }
      }
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to delete question", err);
      alert("Failed to delete question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 6. Reorder Questions (Move Up / Down fallback)
  const handleMoveQuestion = async (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!form || !form.questions) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.questions.length) return;

    const previousQuestions = [...form.questions];
    const newList = arrayMove(form.questions, index, newIndex);

    // Optimistically update UI
    setForm({ ...form, questions: newList });

    try {
      setSaving(true);
      const question_ids = newList.map((q) => q.id);
      await fetcher(`/forms/${form.id}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify({ question_ids }),
      });
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to reorder questions", err);
      alert("Failed to save new order: " + (err.message || "Unknown error"));
      // Rollback UI on failure
      setForm((prev) => (prev ? { ...prev, questions: previousQuestions } : prev));
    } finally {
      setSaving(false);
    }
  };

  // 7. Drag-and-Drop Reordering Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id || !form?.questions) {
      return;
    }

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousQuestions = [...form.questions];
    const newQuestions = arrayMove(form.questions, oldIndex, newIndex);

    // Optimistically update UI
    setForm({ ...form, questions: newQuestions });

    try {
      setSaving(true);
      const question_ids = newQuestions.map((q) => q.id);
      await fetcher(`/forms/${form.id}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify({ question_ids }),
      });
      showSaveBadge();
    } catch (err: any) {
      console.error("Failed to reorder questions via drag and drop", err);
      alert("Failed to save new question order: " + (err.message || "Unknown error"));
      // Rollback UI on failure
      setForm((prev) => (prev ? { ...prev, questions: previousQuestions } : prev));
    } finally {
      setSaving(false);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  // Options Helpers
  const handleAddOption = () => {
    if (!activeQuestion) return;
    const currentOptions = activeQuestion.options || [];
    const newOptionNumber = currentOptions.length + 1;
    const newOpt: QuestionOption = {
      id: 0, // temporary id before save
      question_id: activeQuestion.id,
      value: `Option ${newOptionNumber}`,
      order_index: currentOptions.length,
    };
    const updated = {
      ...activeQuestion,
      options: [...currentOptions, newOpt],
    };
    setActiveQuestion(updated);
    handleSaveActiveQuestion(updated);
  };

  const handleUpdateOptionValue = (index: number, newValue: string) => {
    if (!activeQuestion || !activeQuestion.options) return;
    const newOptions = [...activeQuestion.options];
    newOptions[index] = { ...newOptions[index], value: newValue };
    const updated = { ...activeQuestion, options: newOptions };
    setActiveQuestion(updated);
  };

  const handleDeleteOption = (index: number) => {
    if (!activeQuestion || !activeQuestion.options) return;
    if (activeQuestion.options.length <= 1) {
      alert("A multiple choice or dropdown question must have at least one option.");
      return;
    }
    const newOptions = activeQuestion.options.filter((_, idx) => idx !== index);
    const updated = { ...activeQuestion, options: newOptions };
    setActiveQuestion(updated);
    handleSaveActiveQuestion(updated);
  };

  const handleCopyLink = () => {
    if (!form) return;
    const url = `${window.location.origin}/to/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div style={{ fontSize: "1.5rem", fontWeight: 500 }}>Loading Form Builder...</div>
        <p style={{ color: "var(--muted)" }}>Connecting to backend...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Form</h2>
        <p style={{ color: "var(--danger)" }}>{error || "Form not found"}</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={() => router.push("/")}>
            Back to Workspace
          </button>
          <button className="btn btn-primary" onClick={loadForm}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.builderContainer}>
      {/* Top Navbar */}
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.backLink}>
            ← Workspace
          </Link>
          <input
            type="text"
            className={styles.formTitleInput}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            onBlur={handleSaveFormSettings}
            placeholder="Untitled Form"
            title="Click to edit form title"
          />
          {saveSuccess && <span className={styles.saveIndicator}>✓ Saved</span>}
          {saving && <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Saving...</span>}
        </div>

        <div className={styles.navRight}>
          <span
            className={`${styles.badge} ${
              form.is_published ? styles.badgePublished : styles.badgeDraft
            }`}
          >
            {form.is_published ? "● Published" : "○ Draft"}
          </span>

          {form.is_published && (
            <div className={styles.shareBox}>
              <span className={styles.shareUrl}>
                /to/{form.slug}
              </span>
              <button className={styles.copyBtn} onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          )}

          <button
            className={`btn ${form.is_published ? "btn-secondary" : "btn-primary"}`}
            onClick={handleTogglePublish}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
          >
            {form.is_published ? "Unpublish" : "Publish Form"}
          </button>

          <Link
            href={`/forms/${form.id}/results`}
            className="btn btn-secondary"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
            title="View Form Responses and Statistics"
          >
            📊 Results
          </Link>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className={styles.mainLayout}>
        {/* LEFT PANEL: Questions List */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Questions ({form.questions?.length || 0})</span>
            <button className={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
              + Add
            </button>
          </div>

          <div className={styles.questionList}>
            {/* General Form Settings Item */}
            <div
              className={`${styles.questionItem} ${
                selectedId === "form_settings" ? styles.questionItemActive : ""
              }`}
              onClick={() => setSelectedId("form_settings")}
            >
              <div className={styles.itemLeft}>
                <span className={styles.itemNumber} style={{ background: "rgba(0,0,0,0.06)", color: "var(--foreground)" }}>
                  ⚙
                </span>
                <div className={styles.itemText}>
                  <span className={styles.itemTitle}>Form Settings</span>
                  <span className={styles.itemMeta}>Title & Description</span>
                </div>
              </div>
            </div>

            {/* Questions List with Drag-and-Drop Reordering */}
            {form.questions && form.questions.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={form.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {form.questions.map((q, idx) => {
                    const config = QUESTION_TYPE_CONFIG[q.question_type] || {
                      label: q.question_type,
                      icon: "❓",
                    };
                    const isActive = selectedId === q.id;

                    return (
                      <SortableQuestionItem
                        key={q.id}
                        question={q}
                        index={idx}
                        totalQuestions={form.questions!.length}
                        isSelected={isActive}
                        onSelect={() => setSelectedId(q.id)}
                        onMoveUp={(e) => handleMoveQuestion(idx, "up", e)}
                        onMoveDown={(e) => handleMoveQuestion(idx, "down", e)}
                        onDelete={(e) => handleDeleteQuestion(q.id, e)}
                        config={config}
                      />
                    );
                  })}
                </SortableContext>

                <DragOverlay>
                  {activeDragId && form.questions.find((q) => q.id === activeDragId) ? (
                    (() => {
                      const activeItem = form.questions.find((q) => q.id === activeDragId)!;
                      const activeIdx = form.questions.findIndex((q) => q.id === activeDragId);
                      const config = QUESTION_TYPE_CONFIG[activeItem.question_type] || {
                        label: activeItem.question_type,
                        icon: "❓",
                      };
                      return (
                        <div className={styles.dragOverlayItem}>
                          <div className={styles.itemLeft}>
                            <span className={styles.dragHandle}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="8" cy="6" r="2" />
                                <circle cx="16" cy="6" r="2" />
                                <circle cx="8" cy="12" r="2" />
                                <circle cx="16" cy="12" r="2" />
                                <circle cx="8" cy="18" r="2" />
                                <circle cx="16" cy="18" r="2" />
                              </svg>
                            </span>
                            <span className={styles.itemNumber}>{activeIdx + 1}</span>
                            <div className={styles.itemText}>
                              <span className={styles.itemTitle}>
                                {activeItem.title || "Untitled Question"}
                                {activeItem.is_required && (
                                  <span className={styles.requiredAsterisk}> *</span>
                                )}
                              </span>
                              <span className={styles.itemMeta}>
                                <span>{config.icon}</span>
                                <span>{config.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Thank You Screen item */}
            <div
              className={`${styles.questionItem} ${styles.specialItem} ${
                selectedId === "thank_you" ? styles.questionItemActive : ""
              }`}
              onClick={() => setSelectedId("thank_you")}
            >
              <div className={styles.itemLeft}>
                <span className={styles.itemNumber} style={{ background: "#dcfce7", color: "#166534" }}>
                  🏁
                </span>
                <div className={styles.itemText}>
                  <span className={styles.itemTitle}>Thank You Screen</span>
                  <span className={styles.itemMeta}>Completion message</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: Editor */}
        <section className={styles.editorPanel}>
          {selectedId === "form_settings" && (
            <div>
              <div className={styles.editorHeader}>
                <h2 className={styles.editorTitle}>Form Settings</h2>
              </div>
              <div className={styles.editorForm}>
                <div className={styles.fieldGroup}>
                  <label>Form Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter form title..."
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Form Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Provide additional instructions or details..."
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "1rem" }}
                  onClick={handleSaveFormSettings}
                  disabled={saving}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {selectedId === "thank_you" && (
            <div>
              <div className={styles.editorHeader}>
                <h2 className={styles.editorTitle}>Thank You Screen Settings</h2>
              </div>
              <div className={styles.editorForm}>
                <div className={styles.fieldGroup}>
                  <label>Thank You Headline</label>
                  <input
                    type="text"
                    value={thankYouTitle}
                    onChange={(e) => setThankYouTitle(e.target.value)}
                    placeholder="e.g. Thank you!"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Thank You Message</label>
                  <textarea
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    placeholder="e.g. Your submission has been received."
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "1rem" }}
                  onClick={handleSaveFormSettings}
                  disabled={saving}
                >
                  Save Thank You Screen
                </button>
              </div>
            </div>
          )}

          {typeof selectedId === "number" && activeQuestion && (
            <div>
              <div className={styles.editorHeader}>
                <h2 className={styles.editorTitle}>Edit Question</h2>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem", color: "var(--danger)" }}
                  onClick={() => handleDeleteQuestion(activeQuestion.id)}
                >
                  Delete Question
                </button>
              </div>

              <div className={styles.editorForm}>
                {/* Question Type selector */}
                <div className={styles.fieldGroup}>
                  <label>Question Type</label>
                  <select
                    value={activeQuestion.question_type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      let newOpts = activeQuestion.options || [];
                      if (
                        (newType === QuestionType.multiple_choice || newType === QuestionType.dropdown) &&
                        newOpts.length === 0
                      ) {
                        newOpts = [
                          { id: 0, question_id: activeQuestion.id, value: "Option 1", order_index: 0 },
                          { id: 0, question_id: activeQuestion.id, value: "Option 2", order_index: 1 },
                        ];
                      }
                      const updated = {
                        ...activeQuestion,
                        question_type: newType,
                        options: newOpts,
                      };
                      setActiveQuestion(updated);
                      handleSaveActiveQuestion(updated);
                    }}
                  >
                    {Object.entries(QUESTION_TYPE_CONFIG).map(([t, config]) => (
                      <option key={t} value={t}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Title */}
                <div className={styles.fieldGroup}>
                  <label>Question Title</label>
                  <input
                    type="text"
                    value={activeQuestion.title}
                    onChange={(e) => {
                      setActiveQuestion({ ...activeQuestion, title: e.target.value });
                    }}
                    onBlur={() => handleSaveActiveQuestion(activeQuestion)}
                    placeholder="Enter question text..."
                    required
                  />
                </div>

                {/* Description / Help text */}
                <div className={styles.fieldGroup}>
                  <label>Description / Help Text (Optional)</label>
                  <textarea
                    value={activeQuestion.description || ""}
                    onChange={(e) => {
                      setActiveQuestion({ ...activeQuestion, description: e.target.value });
                    }}
                    onBlur={() => handleSaveActiveQuestion(activeQuestion)}
                    placeholder="Add subtle guidance for the respondent..."
                  />
                </div>

                {/* Required Toggle */}
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={activeQuestion.is_required}
                    onChange={(e) => {
                      const updated = { ...activeQuestion, is_required: e.target.checked };
                      setActiveQuestion(updated);
                      handleSaveActiveQuestion(updated);
                    }}
                  />
                  <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>Required Question</span>
                </label>

                {/* Options Editor for Choice / Dropdown */}
                {(activeQuestion.question_type === QuestionType.multiple_choice ||
                  activeQuestion.question_type === QuestionType.dropdown) && (
                  <div className={styles.optionsSection}>
                    <div className={styles.optionsHeader}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Choices</span>
                    </div>

                    <div className={styles.optionsList}>
                      {activeQuestion.options?.map((opt, idx) => (
                        <div key={idx} className={styles.optionRow}>
                          <span className={styles.optionIndex}>{String.fromCharCode(65 + idx)}</span>
                          <input
                            type="text"
                            className={styles.optionInput}
                            value={opt.value}
                            onChange={(e) => handleUpdateOptionValue(idx, e.target.value)}
                            onBlur={() => handleSaveActiveQuestion(activeQuestion)}
                            placeholder={`Option ${idx + 1}`}
                          />
                          <button
                            type="button"
                            className={styles.miniBtn}
                            onClick={() => handleDeleteOption(idx)}
                            title="Delete option"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <button type="button" className={styles.addOptionBtn} onClick={handleAddOption}>
                      + Add Option
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "1rem" }}
                  onClick={() => handleSaveActiveQuestion(activeQuestion)}
                  disabled={saving}
                >
                  Save Question
                </button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT PANEL: Live Preview */}
        <section className={styles.previewPanel}>
          <span className={styles.previewBadge}>Live Preview</span>

          <div className={styles.previewCard}>
            {selectedId === "form_settings" && (
              <>
                <div className={styles.previewQuestionNumber}>✨ Welcome Screen</div>
                <h1 className={styles.previewTitle}>{formTitle || "Untitled Form"}</h1>
                {formDesc && <p className={styles.previewDesc}>{formDesc}</p>}
                <button type="button" className={styles.previewSubmitBtn}>
                  Start Form ↵
                </button>
              </>
            )}

            {selectedId === "thank_you" && (
              <>
                <div style={{ fontSize: "2.5rem", textAlign: "center" }}>🎉</div>
                <h1 className={styles.previewTitle} style={{ textAlign: "center" }}>
                  {thankYouTitle || "Thank you!"}
                </h1>
                <p className={styles.previewDesc} style={{ textAlign: "center" }}>
                  {thankYouMessage || "Your submission has been received."}
                </p>
              </>
            )}

            {typeof selectedId === "number" && activeQuestion && (
              <>
                <div className={styles.previewQuestionNumber}>
                  <span>
                    {(form.questions?.findIndex((q) => q.id === activeQuestion.id) ?? 0) + 1}
                  </span>
                  <span>→</span>
                  {activeQuestion.is_required && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>* required</span>
                  )}
                </div>

                <h2 className={styles.previewTitle}>{activeQuestion.title || "Question title"}</h2>
                {activeQuestion.description && (
                  <p className={styles.previewDesc}>{activeQuestion.description}</p>
                )}

                <div className={styles.previewInputArea}>
                  {activeQuestion.question_type === QuestionType.short_text && (
                    <input
                      type="text"
                      className={styles.previewUnderlineInput}
                      placeholder="Type your answer here..."
                      readOnly
                    />
                  )}

                  {activeQuestion.question_type === QuestionType.long_text && (
                    <textarea
                      className={styles.previewTextarea}
                      placeholder="Type your detailed response here..."
                      readOnly
                    />
                  )}

                  {activeQuestion.question_type === QuestionType.email && (
                    <input
                      type="email"
                      className={styles.previewUnderlineInput}
                      placeholder="name@example.com"
                      readOnly
                    />
                  )}

                  {activeQuestion.question_type === QuestionType.number && (
                    <input
                      type="number"
                      className={styles.previewUnderlineInput}
                      placeholder="Enter a number..."
                      readOnly
                    />
                  )}

                  {activeQuestion.question_type === QuestionType.multiple_choice && (
                    <div className={styles.previewChoices}>
                      {activeQuestion.options?.map((opt, idx) => (
                        <div key={idx} className={styles.previewChoiceItem}>
                          <span className={styles.previewKeyBadge}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt.value || `Option ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeQuestion.question_type === QuestionType.dropdown && (
                    <select
                      className={styles.previewUnderlineInput}
                      style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "0.75rem" }}
                      disabled
                    >
                      <option>Select an option...</option>
                      {activeQuestion.options?.map((opt, idx) => (
                        <option key={idx}>{opt.value}</option>
                      ))}
                    </select>
                  )}

                  {activeQuestion.question_type === QuestionType.yes_no && (
                    <div className={styles.previewYesNoRow}>
                      <button type="button" className={styles.previewYesNoBtn}>
                        <span className={styles.previewKeyBadge}>Y</span>
                        <span>Yes</span>
                      </button>
                      <button type="button" className={styles.previewYesNoBtn}>
                        <span className={styles.previewKeyBadge}>N</span>
                        <span>No</span>
                      </button>
                    </div>
                  )}

                  {activeQuestion.question_type === QuestionType.rating && (
                    <div className={styles.previewRatingRow}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button key={num} type="button" className={styles.previewRatingBtn}>
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className={styles.previewSubmitBtn}>
                  OK ✓ <span style={{ fontSize: "0.75rem", opacity: 0.8, marginLeft: "0.25rem" }}>press Enter ↵</span>
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Choose a question type</h3>

            <div className={styles.typeGrid}>
              {Object.entries(QUESTION_TYPE_CONFIG).map(([typeKey, config]) => (
                <div
                  key={typeKey}
                  className={styles.typeCard}
                  onClick={() => handleAddQuestion(typeKey as QuestionType)}
                >
                  <span className={styles.typeIcon}>{config.icon}</span>
                  <span>{config.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
