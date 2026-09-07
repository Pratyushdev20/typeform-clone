"use client";

import React from "react";
import { Form } from "../../types";
import { FormRow } from "./FormRow";
import styles from "./FormsList.module.css";

interface FormsListProps {
  forms: Form[];
  searchQuery: string;
  onRename: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onDelete: (form: Form) => void;
  onCopyLink?: (form: Form) => void;
  onCreateClick?: () => void;
}

export const FormsList: React.FC<FormsListProps> = ({
  forms,
  searchQuery,
  onRename,
  onDuplicate,
  onDelete,
  onCopyLink,
  onCreateClick,
}) => {
  if (forms.length === 0) {
    if (searchQuery) {
      return (
        <div className={styles.emptySearchContainer}>
          <div className={styles.searchIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No forms matching &ldquo;{searchQuery}&rdquo;</h3>
          <p className={styles.emptySubtitle}>
            Try checking for typos or clear your search query to see all forms.
          </p>
          {onCreateClick && (
            <button className={styles.emptyActionBtn} onClick={onCreateClick}>
              + Create a form
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={styles.emptyStateCard}>
        <div className={styles.emptyIconContainer}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="14" y1="9" x2="18" y2="9"></line>
            <line x1="14" y1="13" x2="18" y2="13"></line>
            <line x1="14" y1="17" x2="18" y2="17"></line>
          </svg>
        </div>
        <h2 className={styles.emptyHeading}>Ready to create your first form?</h2>
        <p className={styles.emptyDescription}>
          Create a form and start collecting responses.
        </p>
        {onCreateClick && (
          <button className={styles.emptyActionBtn} onClick={onCreateClick}>
            <span className={styles.btnPlus}>+</span>
            <span>Create a form</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerName}></div>
        <div className={styles.headerMeta}>Responses</div>
        <div className={styles.headerMeta}>Completed</div>
        <div className={styles.headerMeta}>Updated</div>
        <div className={styles.headerMeta}>Integrations</div>
        <div className={styles.headerActions}></div>
      </div>

      {/* Table Body */}
      <div className={styles.tableBody}>
        {forms.map((form) => (
          <FormRow
            key={form.id}
            form={form}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onCopyLink={onCopyLink}
          />
        ))}
      </div>
    </div>
  );
};
