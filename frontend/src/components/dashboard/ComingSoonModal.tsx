"use client";

import React, { useEffect } from "react";
import styles from "./ComingSoonModal.module.css";

interface ComingSoonModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  title,
  description = "This feature is currently under active development as part of upcoming workspace updates.",
  isOpen,
  onClose,
}) => {
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>🚀</div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <button className={styles.gotItBtn} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
};
