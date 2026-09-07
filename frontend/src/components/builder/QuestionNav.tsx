"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question } from "../../types";
import { QUESTION_TYPE_CONFIGS } from "./builderTypes";
import styles from "./QuestionNav.module.css";

interface QuestionNavProps {
  questions: Question[];
  selectedId: number | "thank_you" | "form_settings";
  onSelect: (id: number | "thank_you" | "form_settings") => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (id: number, e: React.MouseEvent) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

interface SortableItemProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableItem({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const config = QUESTION_TYPE_CONFIGS[question.question_type] || {
    icon: "❓",
    label: question.question_type,
    badgeBg: "#f1f5f9",
    badgeColor: "#475569",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.navItem} ${isSelected ? styles.navItemActive : ""}`}
      onClick={onSelect}
    >
      <div className={styles.itemLeft}>
        {/* Drag handle */}
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="6" r="2" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="8" cy="12" r="2" />
            <circle cx="16" cy="12" r="2" />
            <circle cx="8" cy="18" r="2" />
            <circle cx="16" cy="18" r="2" />
          </svg>
        </button>

        {/* Colored type badge with number */}
        <div
          className={styles.typeBadge}
          style={{ backgroundColor: config.badgeBg, color: config.badgeColor }}
        >
          <span className={styles.badgeIcon}>{config.icon}</span>
          <span className={styles.badgeNumber}>{index + 1}</span>
        </div>

        {/* Title */}
        <div className={styles.itemInfo}>
          <span className={styles.itemTitle}>
            {question.title || "Untitled question"}
            {question.is_required && <span className={styles.requiredStar}> *</span>}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}
        title="Delete question"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
  questions,
  selectedId,
  onSelect,
  onAddQuestion,
  onDeleteQuestion,
  onReorder,
}) => {
  const [activeDragId, setActiveDragId] = React.useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <aside className={styles.navSidebar}>
      {/* Add Content Header */}
      <div className={styles.sidebarHeader}>
        <button className={styles.addContentBtn} onClick={onAddQuestion}>
          <span className={styles.plusIcon}>+</span>
          <span>Add content</span>
        </button>
      </div>

      {/* Questions Section */}
      <div className={styles.questionsList}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((q, idx) => (
              <SortableItem
                key={q.id}
                question={q}
                index={idx}
                isSelected={selectedId === q.id}
                onSelect={() => onSelect(q.id)}
                onDelete={(e) => onDeleteQuestion(q.id, e)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeDragId && questions.find((q) => q.id === activeDragId) ? (
              (() => {
                const activeItem = questions.find((q) => q.id === activeDragId)!;
                const activeIdx = questions.findIndex((q) => q.id === activeDragId);
                const config = QUESTION_TYPE_CONFIGS[activeItem.question_type] || {
                  icon: "❓",
                  badgeBg: "#f1f5f9",
                  badgeColor: "#475569",
                };
                return (
                  <div className={`${styles.navItem} ${styles.navItemOverlay}`}>
                    <div className={styles.itemLeft}>
                      <div
                        className={styles.typeBadge}
                        style={{ backgroundColor: config.badgeBg, color: config.badgeColor }}
                      >
                        <span className={styles.badgeIcon}>{config.icon}</span>
                        <span className={styles.badgeNumber}>{activeIdx + 1}</span>
                      </div>
                      <span className={styles.itemTitle}>{activeItem.title}</span>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Endings / Thank You Screen Section */}
      <div className={styles.endingsSection}>
        <div className={styles.endingsHeader}>
          <span>Endings</span>
        </div>
        <div
          className={`${styles.navItem} ${selectedId === "thank_you" ? styles.navItemActive : ""}`}
          onClick={() => onSelect("thank_you")}
        >
          <div className={styles.itemLeft}>
            <div className={styles.typeBadge} style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
              <span className={styles.badgeIcon}>🏁</span>
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.itemTitle}>Thank you screen</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
