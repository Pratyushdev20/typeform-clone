"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question } from "../../../types";
import styles from "./builder.module.css";

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  totalQuestions: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  config: { label: string; icon: string };
}

export function SortableQuestionItem({
  question,
  index,
  totalQuestions,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  config,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.questionItem} ${
        isSelected ? styles.questionItemActive : ""
      }`}
      onClick={onSelect}
    >
      <div className={styles.itemLeft}>
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <span className={styles.itemNumber}>
          {index + 1}
        </span>

        <div className={styles.itemText}>
          <span className={styles.itemTitle}>
            {question.title || "Untitled Question"}

            {question.is_required && (
              <span className={styles.requiredAsterisk}> *</span>
            )}
          </span>

          <span className={styles.itemMeta}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          type="button"
          className={styles.miniBtn}
          disabled={index === 0}
          onClick={onMoveUp}
          title="Move Up"
        >
          ▲
        </button>

        <button
          type="button"
          className={styles.miniBtn}
          disabled={index === totalQuestions - 1}
          onClick={onMoveDown}
          title="Move Down"
        >
          ▼
        </button>

        <button
          type="button"
          className={`${styles.miniBtn} ${styles.miniBtnDelete}`}
          onClick={onDelete}
          title="Delete Question"
        >
          ✕
        </button>
      </div>
    </div>
  );
}