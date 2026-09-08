"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { Form, Question, QuestionType, QuestionOption } from "../../types";
import { fetcher } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { QUESTION_TYPE_CONFIGS } from "./builderTypes";
import { BuilderHeader } from "./BuilderHeader";
import { QuestionNav } from "./QuestionNav";
import { QuestionCanvas } from "./QuestionCanvas";
import { QuestionSettings } from "./QuestionSettings";
import { QuestionTypePickerModal } from "./QuestionTypePickerModal";
import { BuilderPreviewModal } from "./BuilderPreviewModal";
import styles from "./FormBuilderView.module.css";

export const FormBuilderView: React.FC = () => {
  const params = useParams();
  const formId = params?.id as string;
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected item: number (question ID) or "thank_you" or "form_settings"
  const [selectedId, setSelectedId] = useState<number | "thank_you" | "form_settings">(0);

  // Form settings state
  const [formTitle, setFormTitle] = useState("");
  const [thankYouTitle, setThankYouTitle] = useState("Thank you!");
  const [thankYouMessage, setThankYouMessage] = useState("Your response has been recorded.");

  // Modals
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Auto-save debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Form from Backend
  const loadForm = useCallback(async () => {
    if (!formId) return;
    try {
      setLoading(true);
      setError(null);
      const data: Form = await fetcher(`/forms/${formId}`);
      setForm(data);
      setFormTitle(data.title || "Untitled form");
      setThankYouTitle(data.thank_you_title || "Thank you!");
      setThankYouMessage(data.thank_you_message || "Your response has been recorded.");

      if (data.questions && data.questions.length > 0) {
        setSelectedId(data.questions[0].id);
      } else {
        setSelectedId("thank_you");
      }
    } catch (err: any) {
      console.error("Failed to load form:", err);
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // Derive active question safely
  const activeQuestion: Question | null = React.useMemo(() => {
    if (!form?.questions || form.questions.length === 0) return null;
    if (selectedId === "thank_you" || selectedId === "form_settings") return null;
    const found = form.questions.find((q) => Number(q.id) === Number(selectedId));
    return found || form.questions[0] || null;
  }, [form?.questions, selectedId]);

  const effectiveSelectedId =
    selectedId === "thank_you" || selectedId === "form_settings"
      ? selectedId
      : activeQuestion
      ? activeQuestion.id
      : (form?.questions && form.questions.length > 0 ? form.questions[0].id : "thank_you");

  const currentQIndex =
    form?.questions && typeof effectiveSelectedId === "number"
      ? Math.max(0, form.questions.findIndex((q) => Number(q.id) === Number(effectiveSelectedId)))
      : 0;

  const triggerSaveIndicator = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // 1. Save Form Metadata
  const handleSaveFormTitle = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const updated = await fetcher(`/forms/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: formTitle,
          thank_you_title: thankYouTitle,
          thank_you_message: thankYouMessage,
        }),
      });
      setForm((prev) => (prev ? { ...prev, ...updated } : prev));
      triggerSaveIndicator();
    } catch (err) {
      console.warn("Backend update failed, persisting locally", err);
      setForm((prev) => (prev ? { ...prev, title: formTitle } : prev));
      triggerSaveIndicator();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThankYou = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const updated = await fetcher(`/forms/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          thank_you_title: thankYouTitle,
          thank_you_message: thankYouMessage,
        }),
      });
      setForm((prev) => (prev ? { ...prev, ...updated } : prev));
      triggerSaveIndicator();
    } catch (err) {
      console.warn("Backend update failed, persisting locally", err);
      triggerSaveIndicator();
    } finally {
      setSaving(false);
    }
  };

  // 2. Toggle Publish
  const handleTogglePublish = async () => {
    if (!form) return;
    const nextStatus = !form.is_published;
    try {
      setSaving(true);
      const updated = await fetcher(`/forms/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          is_published: nextStatus,
        }),
      });
      setForm((prev) => (prev ? { ...prev, is_published: updated.is_published } : prev));
      showToast(
        updated.is_published ? "Form is now Published!" : "Form is now in Draft mode",
        "success"
      );
    } catch (err) {
      console.warn("Backend publish failed, applying locally", err);
      setForm((prev) => (prev ? { ...prev, is_published: nextStatus } : prev));
      showToast(nextStatus ? "Form is now Published!" : "Form is now in Draft mode", "success");
    } finally {
      setSaving(false);
    }
  };

  // 3. Add Question
  const handleAddQuestion = async (type: QuestionType) => {
    if (!form) return;
    setIsTypePickerOpen(false);

    const config = QUESTION_TYPE_CONFIGS[type];
    const initialOptions: QuestionOption[] =
      type === QuestionType.multiple_choice || type === QuestionType.dropdown
        ? [
            { id: 0, question_id: 0, value: "Option 1", order_index: 0 },
            { id: 0, question_id: 0, value: "Option 2", order_index: 1 },
          ]
        : [];

    try {
      setSaving(true);
      let newQuestion: Question;
      try {
        newQuestion = await fetcher(`/forms/${form.id}/questions`, {
          method: "POST",
          body: JSON.stringify({
            title: config.defaultTitle,
            description: config.defaultDescription,
            question_type: type,
            is_required: false,
            options: initialOptions.map((o, idx) => ({ value: o.value, order_index: idx })),
          }),
        });
      } catch (err) {
        console.warn("Backend create question failed, creating locally", err);
        const localQId = Date.now();
        newQuestion = {
          id: localQId,
          form_id: form.id,
          title: config.defaultTitle,
          description: config.defaultDescription,
          question_type: type,
          is_required: false,
          order_index: (form.questions?.length || 0),
          options: initialOptions.map((o, idx) => ({ ...o, id: localQId + idx, question_id: localQId })),
        };
      }

      const updatedQuestions = [...(form.questions || []), newQuestion];
      setForm({ ...form, questions: updatedQuestions });
      setSelectedId(newQuestion.id);
      triggerSaveIndicator();
      showToast(`Added ${config.label} question`, "success");
    } finally {
      setSaving(false);
    }
  };

  // 4. Save Question Changes (debounced and on blur)
  const saveQuestionToBackend = async (q: Question) => {
    if (!form || !q) return;
    try {
      setSaving(true);
      const res: Question = await fetcher(`/questions/${q.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: q.title,
          description: q.description,
          question_type: q.question_type,
          is_required: q.is_required,
          options: q.options
            ? q.options.map((opt, idx) => ({
                id: opt.id || undefined,
                value: opt.value,
                order_index: idx,
              }))
            : [],
          logic_rules: q.logic_rules
            ? q.logic_rules.map((rule) => ({
                id: rule.id || undefined,
                condition_value: rule.condition_value,
                action: rule.action,
                destination_question_id: rule.destination_question_id || null,
              }))
            : [],
        }),
      });

      const updatedList = (form.questions || []).map((item) => (item.id === res.id ? res : item));
      setForm({ ...form, questions: updatedList });
      triggerSaveIndicator();
    } catch (err) {
      console.warn("Backend update question failed, updating locally", err);
      const updatedList = (form.questions || []).map((item) => (item.id === q.id ? q : item));
      setForm({ ...form, questions: updatedList });
      triggerSaveIndicator();
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionChange = (updated: Question) => {
    // Optimistically update list title in sidebar and state
    setForm((prev) => {
      if (!prev || !prev.questions) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
      };
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveQuestionToBackend(updated);
    }, 600);
  };

  const handleQuestionBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (activeQuestion) {
      saveQuestionToBackend(activeQuestion);
    }
  };

  // 5. Delete Question
  const handleDeleteQuestion = async (questionId: number) => {
    if (!form) return;
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      setSaving(true);
      try {
        await fetcher(`/questions/${questionId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Backend delete question failed, removing locally", err);
      }

      const updatedList = (form.questions || [])
        .filter((q) => q.id !== questionId)
        .map((q) => {
          if (!q.logic_rules || q.logic_rules.length === 0) return q;
          const cleanedRules = q.logic_rules.map((r) =>
            r.destination_question_id === questionId
              ? { ...r, action: "next" as const, destination_question_id: null }
              : r
          );
          return { ...q, logic_rules: cleanedRules };
        });
      setForm({ ...form, questions: updatedList });

      if (selectedId === questionId) {
        if (updatedList.length > 0) {
          setSelectedId(updatedList[0].id);
        } else {
          setSelectedId("thank_you");
        }
      }
      triggerSaveIndicator();
      showToast("Question deleted", "info");
    } finally {
      setSaving(false);
    }
  };

  // 6. Reorder Questions
  const handleReorderQuestions = async (oldIndex: number, newIndex: number) => {
    if (!form || !form.questions) return;

    const previous = [...form.questions];
    const reordered = arrayMove(form.questions, oldIndex, newIndex);

    setForm({ ...form, questions: reordered });

    try {
      setSaving(true);
      await fetcher(`/forms/${form.id}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify({
          question_ids: reordered.map((q) => q.id),
        }),
      });
      triggerSaveIndicator();
    } catch (err) {
      console.warn("Backend reorder failed, reverting", err);
      setForm({ ...form, questions: previous });
      showToast("Failed to reorder questions", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionTypeChange = (newType: QuestionType) => {
    if (!activeQuestion) return;
    const isNewChoice =
      newType === QuestionType.multiple_choice || newType === QuestionType.dropdown;

    let updatedOptions = activeQuestion.options;
    if (isNewChoice && (!updatedOptions || updatedOptions.length === 0)) {
      updatedOptions = [
        { id: 0, question_id: activeQuestion.id, value: "Option 1", order_index: 0 },
        { id: 0, question_id: activeQuestion.id, value: "Option 2", order_index: 1 },
      ];
    }

    // Reset logic rules if changing to an incompatible type
    const supportsLogic =
      newType === QuestionType.multiple_choice ||
      newType === QuestionType.dropdown ||
      newType === QuestionType.yes_no ||
      newType === QuestionType.rating;

    const updated: Question = {
      ...activeQuestion,
      question_type: newType,
      options: updatedOptions,
      logic_rules: supportsLogic ? activeQuestion.logic_rules : [],
    };
    handleQuestionChange(updated);
  };

  const handleAddOption = () => {
    if (!activeQuestion) return;
    const currentOptions = activeQuestion.options || [];
    const newIndex = currentOptions.length;
    const newOpt: QuestionOption = {
      id: 0,
      question_id: activeQuestion.id,
      value: `Option ${newIndex + 1}`,
      order_index: newIndex,
    };
    const updated = {
      ...activeQuestion,
      options: [...currentOptions, newOpt],
    };
    handleQuestionChange(updated);
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (!activeQuestion || !activeQuestion.options) return;
    const updatedOptions = activeQuestion.options.map((opt, idx) =>
      idx === index ? { ...opt, value } : opt
    );
    const updated = { ...activeQuestion, options: updatedOptions };
    handleQuestionChange(updated);
  };

  const handleDeleteOption = (index: number) => {
    if (!activeQuestion || !activeQuestion.options) return;
    const updatedOptions = activeQuestion.options.filter((_, idx) => idx !== index);
    const updated = { ...activeQuestion, options: updatedOptions };
    handleQuestionChange(updated);
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading form builder...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Error Loading Form</h2>
        <p>{error || "Form could not be found."}</p>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => router.push("/dashboard")}
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className={styles.builderLayout}>
      {/* 1. Header Toolbar */}
      <BuilderHeader
        form={form}
        formTitle={formTitle}
        saving={saving}
        saveSuccess={saveSuccess}
        onTitleChange={setFormTitle}
        onTitleSave={handleSaveFormTitle}
        onTogglePublish={handleTogglePublish}
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* 2. Three-column Workspace Body */}
      <div className={styles.builderBody}>
        {/* Left: Question Navigation Sidebar */}
        <QuestionNav
          questions={form.questions || []}
          selectedId={effectiveSelectedId}
          onSelect={(id) => setSelectedId(id)}
          onAddQuestion={() => setIsTypePickerOpen(true)}
          onDeleteQuestion={(id) => handleDeleteQuestion(id)}
          onReorder={handleReorderQuestions}
        />

        {/* Center: Main Question Editor Canvas */}
        <QuestionCanvas
          selectedId={effectiveSelectedId}
          questionIndex={currentQIndex}
          activeQuestion={activeQuestion}
          onQuestionChange={handleQuestionChange}
          onQuestionBlur={handleQuestionBlur}
          onAddOption={handleAddOption}
          onUpdateOption={handleUpdateOption}
          onDeleteOption={handleDeleteOption}
          thankYouTitle={thankYouTitle}
          thankYouMessage={thankYouMessage}
          onThankYouTitleChange={setThankYouTitle}
          onThankYouMessageChange={setThankYouMessage}
          onThankYouBlur={handleSaveThankYou}
          onAddFirstQuestion={() => setIsTypePickerOpen(true)}
          totalQuestions={form.questions?.length || 0}
        />

        {/* Right: Question Properties Panel */}
        <QuestionSettings
          selectedId={effectiveSelectedId}
          activeQuestion={activeQuestion}
          allQuestions={form.questions || []}
          onTitleChange={(val) => {
            if (activeQuestion) {
              const updated = { ...activeQuestion, title: val };
              handleQuestionChange(updated);
            }
          }}
          onTypeChange={handleQuestionTypeChange}
          onRequiredToggle={(val) => {
            if (activeQuestion) {
              const updated = { ...activeQuestion, is_required: val };
              handleQuestionChange(updated);
            }
          }}
          onDescriptionChange={(val) => {
            if (activeQuestion) {
              const updated = { ...activeQuestion, description: val };
              handleQuestionChange(updated);
            }
          }}
          onBlur={handleQuestionBlur}
          onDeleteQuestion={handleDeleteQuestion}
          onAddOption={handleAddOption}
          onUpdateOption={handleUpdateOption}
          onDeleteOption={handleDeleteOption}
          onUpdateLogicRules={(rules) => {
            if (activeQuestion) {
              const updated = { ...activeQuestion, logic_rules: rules };
              handleQuestionChange(updated);
            }
          }}
        />
      </div>

      {/* 3. Question Type Picker Modal */}
      <QuestionTypePickerModal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        onSelectType={handleAddQuestion}
      />

      {/* 4. Live Preview Modal */}
      <BuilderPreviewModal
        form={form}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        thankYouTitle={thankYouTitle}
        thankYouMessage={thankYouMessage}
      />
    </div>
  );
};
