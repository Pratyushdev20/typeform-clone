"use client";

import React from "react";
import Link from "next/link";
import { Form } from "../../types";
import { FormActionsMenu } from "./FormActionsMenu";
import styles from "./FormCard.module.css";

interface FormCardProps {
  form: Form;
  onRename: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onDelete: (form: Form) => void;
  onCopyLink?: (form: Form) => void;
}

export const FormCard: React.FC<FormCardProps> = ({
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

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <Link href={`/forms/${form.id}`} className={styles.thumbnailWrapper}>
          <div className={styles.formThumbnail}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="14" y1="9" x2="18" y2="9"></line>
              <line x1="14" y1="13" x2="18" y2="13"></line>
            </svg>
          </div>
        </Link>
        <div className={styles.cardTopRight}>
          <span
            className={`${styles.statusBadge} ${
              form.is_published ? styles.badgePublished : styles.badgeDraft
            }`}
          >
            {form.is_published ? "Published" : "Draft"}
          </span>
          <FormActionsMenu
            form={form}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onCopyLink={onCopyLink}
          />
        </div>
      </div>

      <Link href={`/forms/${form.id}`} className={styles.titleLink}>
        <h3 className={styles.cardTitle}>{form.title}</h3>
        {form.description && (
          <p className={styles.cardDesc}>{form.description}</p>
        )}
      </Link>

      <div className={styles.cardFooter}>
        <div className={styles.responseCount}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>{responseCount} {responseCount === 1 ? "response" : "responses"}</span>
        </div>
        <div className={styles.updatedDate}>
          {formatDate(form.updated_at || form.created_at)}
        </div>
      </div>
    </div>
  );
};
