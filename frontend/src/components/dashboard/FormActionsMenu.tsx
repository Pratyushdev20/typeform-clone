"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Form } from "../../types";
import styles from "./FormActionsMenu.module.css";

interface FormActionsMenuProps {
  form: Form;
  onRename: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onDelete: (form: Form) => void;
  onCopyLink?: (form: Form) => void;
}

export const FormActionsMenu: React.FC<FormActionsMenuProps> = ({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onCopyLink,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button
        className={styles.menuTriggerBtn}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="More actions"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownPopup} onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/forms/${form.id}`}
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit form</span>
          </Link>

          <Link
            href={`/forms/${form.id}/results`}
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>View results</span>
          </Link>

          {onCopyLink && (
            <button
              className={styles.menuItem}
              onClick={() => {
                onCopyLink(form);
                setIsOpen(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>Copy respondent link</span>
            </button>
          )}

          <button
            className={styles.menuItem}
            onClick={() => {
              onRename(form);
              setIsOpen(false);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            <span>Rename</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              onDuplicate(form);
              setIsOpen(false);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Duplicate</span>
          </button>

          <div className={styles.divider} />

          <button
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            onClick={() => {
              onDelete(form);
              setIsOpen(false);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
