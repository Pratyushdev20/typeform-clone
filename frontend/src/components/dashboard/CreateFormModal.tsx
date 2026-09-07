"use client";

import React, { useState, useEffect } from "react";
import styles from "./CreateFormModal.module.css";

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string) => Promise<void>;
}

export const CreateFormModal: React.FC<CreateFormModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setIsSubmitting(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || "Untitled form";
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreate(finalTitle, description.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Create a new form</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="formNameInput" className={styles.label}>
              Form name
            </label>
            <input
              id="formNameInput"
              type="text"
              className={styles.textInput}
              placeholder="Untitled form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="formDescInput" className={styles.label}>
              Description <span className={styles.optional}>(Optional)</span>
            </label>
            <textarea
              id="formDescInput"
              className={styles.textareaInput}
              placeholder="Give respondents context on what this form is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
