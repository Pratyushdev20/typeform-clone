"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuestionType } from "../../types";
import { QUESTION_TYPE_CONFIGS, QuestionTypeConfig } from "./builderTypes";
import styles from "./QuestionTypePickerModal.module.css";

interface QuestionTypePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: QuestionType) => void;
}

export const QuestionTypePickerModal: React.FC<QuestionTypePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearch("");
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

  const categories = useMemo(() => {
    const allConfigs = Object.values(QUESTION_TYPE_CONFIGS);
    const filtered = search.trim()
      ? allConfigs.filter((c) =>
          c.label.toLowerCase().includes(search.toLowerCase().trim())
        )
      : allConfigs;

    const map: Record<string, QuestionTypeConfig[]> = {
      "Contact info": [],
      Choice: [],
      Text: [],
      "Rating & ranking": [],
    };

    filtered.forEach((cfg) => {
      if (cfg.category === "Contact") map["Contact info"].push(cfg);
      else if (cfg.category === "Choice") map["Choice"].push(cfg);
      else if (cfg.category === "Text") map["Text"].push(cfg);
      else if (cfg.category === "Rating & Numbers") map["Rating & ranking"].push(cfg);
    });

    return map;
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className={styles.header}>
          <div className={styles.headerTabs}>
            <span className={styles.activeTab}>Add form elements</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchBarWrapper}>
          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search form elements"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Elements Grid grouped by category */}
        <div className={styles.categoriesGrid}>
          {Object.entries(categories).map(([catName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={catName} className={styles.categoryColumn}>
                <h4 className={styles.categoryTitle}>{catName}</h4>
                <div className={styles.itemsList}>
                  {items.map((cfg) => (
                    <button
                      key={cfg.type}
                      className={styles.elementCard}
                      onClick={() => onSelectType(cfg.type)}
                    >
                      <div
                        className={styles.iconContainer}
                        style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeColor }}
                      >
                        {cfg.icon}
                      </div>
                      <span className={styles.elementLabel}>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
