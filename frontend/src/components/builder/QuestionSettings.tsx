"use client";

import React from "react";
import { Question, QuestionType } from "../../types";
import { QUESTION_TYPE_CONFIGS } from "./builderTypes";
import styles from "./QuestionSettings.module.css";

interface QuestionSettingsProps {
  selectedId: number | "thank_you" | "form_settings";
  activeQuestion: Question | null;
  onTypeChange: (newType: QuestionType) => void;
  onRequiredToggle: (val: boolean) => void;
  onDescriptionChange: (val: string) => void;
  onBlur: () => void;
  onDeleteQuestion: (id: number) => void;
  onAddOption: () => void;
  onUpdateOption: (idx: number, val: string) => void;
  onDeleteOption: (idx: number) => void;
}

export const QuestionSettings: React.FC<QuestionSettingsProps> = ({
  selectedId,
  activeQuestion,
  onTypeChange,
  onRequiredToggle,
  onDescriptionChange,
  onBlur,
  onDeleteQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) => {
  if (selectedId === "thank_you" || selectedId === "form_settings" || !activeQuestion) {
    return (
      <aside className={styles.settingsPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.headerTitle}>
            {selectedId === "thank_you" ? "End Screen Settings" : "Form Settings"}
          </span>
        </div>
        <div className={styles.emptySettingsInfo}>
          <p>Configure headline and message directly on the main canvas.</p>
        </div>
      </aside>
    );
  }

  const currentConfig = QUESTION_TYPE_CONFIGS[activeQuestion.question_type] || {
    icon: "❓",
    label: activeQuestion.question_type,
  };

  const isChoiceType =
    activeQuestion.question_type === QuestionType.multiple_choice ||
    activeQuestion.question_type === QuestionType.dropdown;

  return (
    <aside className={styles.settingsPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.headerTitle}>Question</span>
      </div>

      <div className={styles.panelBody}>
        {/* Question Type selector */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>Answer Type</label>
          <select
            className={styles.selectInput}
            value={activeQuestion.question_type}
            onChange={(e) => onTypeChange(e.target.value as QuestionType)}
          >
            {Object.entries(QUESTION_TYPE_CONFIGS).map(([typeKey, cfg]) => (
              <option key={typeKey} value={typeKey}>
                {cfg.icon} {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Required Toggle */}
        <div className={styles.settingGroup}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.settingLabel} style={{ marginBottom: 2 }}>Required</div>
              <div className={styles.settingSubtext}>Mandatory question</div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={activeQuestion.is_required}
                onChange={(e) => onRequiredToggle(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </div>

        {/* Description / Help text */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>Help text (optional)</label>
          <textarea
            className={styles.textareaInput}
            value={activeQuestion.description || ""}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={onBlur}
            placeholder="Help respondents answer this question..."
            rows={2}
          />
        </div>

        {/* Choices Settings for Multiple Choice / Dropdown */}
        {isChoiceType && (
          <div className={styles.settingGroup}>
            <div className={styles.choicesHeaderRow}>
              <label className={styles.settingLabel}>Choices</label>
              <button
                type="button"
                className={styles.miniAddBtn}
                onClick={onAddOption}
              >
                + Add
              </button>
            </div>
            <div className={styles.choicesList}>
              {activeQuestion.options?.map((opt, idx) => (
                <div key={idx} className={styles.choiceRow}>
                  <span className={styles.choiceBadge}>{idx + 1}</span>
                  <input
                    type="text"
                    className={styles.choiceTextInput}
                    value={opt.value}
                    onChange={(e) => onUpdateOption(idx, e.target.value)}
                    onBlur={onBlur}
                  />
                  {activeQuestion.options && activeQuestion.options.length > 1 && (
                    <button
                      type="button"
                      className={styles.choiceRemoveBtn}
                      onClick={() => onDeleteOption(idx)}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger zone / Delete */}
        <div className={styles.deleteSection}>
          <button
            type="button"
            className={styles.deleteQuestionBtn}
            onClick={() => onDeleteQuestion(activeQuestion.id)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Delete question</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
