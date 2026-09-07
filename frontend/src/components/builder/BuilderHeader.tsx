"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Form } from "../../types";
import styles from "./BuilderHeader.module.css";

interface BuilderHeaderProps {
  form: Form;
  formTitle: string;
  onTitleChange: (newTitle: string) => void;
  onTitleSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
  onTogglePublish: () => void;
  onOpenPreview: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  form,
  formTitle,
  onTitleChange,
  onTitleSave,
  saving,
  saveSuccess,
  onTogglePublish,
  onOpenPreview,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/to/${form.slug || form.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className={styles.header}>
      {/* Left: Breadcrumb & Title */}
      <div className={styles.leftSection}>
        <Link href="/" className={styles.backBtn} title="Back to workspace">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>My workspace</Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          <input
            type="text"
            className={styles.titleInput}
            value={formTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleSave}
            placeholder="Untitled form"
            title="Click to edit form title"
          />
        </div>

        {/* Save Status Indicator */}
        <div className={styles.saveStatusWrapper}>
          {saving && (
            <span className={styles.savingIndicator}>
              <span className={styles.spinner} /> Saving...
            </span>
          )}
          {!saving && saveSuccess && (
            <span className={styles.savedIndicator}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Center: Active Tab */}
      <div className={styles.centerSection}>
        <div className={styles.modeTabActive}>
          <span>Content</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className={styles.rightSection}>
        {/* Preview Button */}
        <button
          className={styles.previewBtn}
          onClick={onOpenPreview}
          title="Preview respondent form"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Preview</span>
        </button>

        {/* Share Link Button when Published */}
        {form.is_published && (
          <button
            className={styles.shareBtn}
            onClick={handleCopyLink}
            title="Copy public link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </button>
        )}

        {/* Publish / Unpublish Button */}
        <button
          className={`${styles.publishBtn} ${
            form.is_published ? styles.publishBtnPublished : styles.publishBtnDraft
          }`}
          onClick={onTogglePublish}
          disabled={saving}
        >
          <span className={styles.statusDot} />
          <span>{form.is_published ? "Published" : "Publish"}</span>
        </button>

        {/* Results Link */}
        <Link
          href={`/forms/${form.id}/results`}
          className={styles.resultsBtn}
          title="View responses and insights"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Results</span>
        </Link>
      </div>
    </header>
  );
};
