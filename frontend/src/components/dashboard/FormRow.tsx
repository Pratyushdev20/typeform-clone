"use client";

import React from "react";
import Link from "next/link";
import { Form } from "../../types";
import { FormActionsMenu } from "./FormActionsMenu";
import styles from "./FormRow.module.css";

interface FormRowProps {
  form: Form;
  onRename: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onDelete: (form: Form) => void;
  onCopyLink?: (form: Form) => void;
}

export const FormRow: React.FC<FormRowProps> = ({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onCopyLink,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sep 07, 2026";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Sep 07, 2026";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Sep 07, 2026";
    }
  };

  const responseCount = form.response_count ?? 0;
  const completionRate =
    form.completion_rate !== undefined
      ? `${form.completion_rate}%`
      : responseCount > 0
      ? "100%"
      : "-";

  return (
    <div className={styles.row}>
      {/* Title column with thumbnail and status badge */}
      <div className={styles.nameCol}>
        <Link href={`/forms/${form.id}`} className={styles.nameLink}>
          <div className={styles.formIconThumbnail}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="14" y1="9" x2="18" y2="9"></line>
              <line x1="14" y1="13" x2="18" y2="13"></line>
              <line x1="14" y1="17" x2="18" y2="17"></line>
            </svg>
          </div>
          <div className={styles.titleWrapper}>
            <span className={styles.formTitle}>{form.title}</span>
            <span
              className={`${styles.statusBadge} ${
                form.is_published ? styles.badgePublished : styles.badgeDraft
              }`}
            >
              {form.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </Link>
      </div>

      {/* Responses */}
      <div className={styles.metaCol}>
        <span className={styles.metaText}>
          {responseCount > 0 ? responseCount : "-"}
        </span>
      </div>

      {/* Completed */}
      <div className={styles.metaCol}>
        <span className={styles.metaText}>{completionRate}</span>
      </div>

      {/* Updated */}
      <div className={styles.metaCol}>
        <span className={styles.dateText}>{formatDate(form.updated_at || form.created_at)}</span>
      </div>

      {/* Integrations */}
      <div className={styles.integrationsCol}>
        <button
          className={styles.integrationsIconBtn}
          title="Connected Integrations"
          onClick={() => alert(`Integrations for "${form.title}" (Coming Soon)`)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
      </div>

      {/* Actions Menu */}
      <div className={styles.actionsCol}>
        <FormActionsMenu
          form={form}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onCopyLink={onCopyLink}
        />
      </div>
    </div>
  );
};
