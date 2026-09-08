"use client";

import React from "react";
import { Question, QuestionType, LogicRule } from "../../types";
import { QUESTION_TYPE_CONFIGS } from "./builderTypes";
import styles from "./QuestionSettings.module.css";

interface QuestionSettingsProps {
  selectedId: number | "thank_you" | "form_settings";
  activeQuestion: Question | null;
  allQuestions?: Question[];
  onTitleChange?: (val: string) => void;
  onTypeChange: (newType: QuestionType) => void;
  onRequiredToggle: (val: boolean) => void;
  onDescriptionChange: (val: string) => void;
  onBlur: () => void;
  onDeleteQuestion: (id: number) => void;
  onAddOption: () => void;
  onUpdateOption: (idx: number, val: string) => void;
  onDeleteOption: (idx: number) => void;
  onUpdateLogicRules?: (rules: LogicRule[]) => void;
}

export const QuestionSettings: React.FC<QuestionSettingsProps> = ({
  selectedId,
  activeQuestion,
  allQuestions = [],
  onTitleChange,
  onTypeChange,
  onRequiredToggle,
  onDescriptionChange,
  onBlur,
  onDeleteQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onUpdateLogicRules,
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

  const supportsLogic =
    activeQuestion.question_type === QuestionType.multiple_choice ||
    activeQuestion.question_type === QuestionType.dropdown ||
    activeQuestion.question_type === QuestionType.yes_no ||
    activeQuestion.question_type === QuestionType.rating;

  // Compute available condition values for this question type
  const getConditionOptions = () => {
    if (activeQuestion.question_type === QuestionType.yes_no) {
      return [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ];
    }
    if (activeQuestion.question_type === QuestionType.rating) {
      return [1, 2, 3, 4, 5].map((num) => ({
        label: `${num} ★`,
        value: num.toString(),
      }));
    }
    if (isChoiceType) {
      return (activeQuestion.options || []).map((opt) => ({
        label: opt.value || "(Empty option)",
        value: opt.value,
      }));
    }
    return [];
  };

  const conditionOptions = getConditionOptions();

  // Sibling questions in the form (excluding self)
  const siblingQuestions = allQuestions.filter((q) => q.id !== activeQuestion.id);

  const logicRules: LogicRule[] = activeQuestion.logic_rules || [];

  const handleAddRule = () => {
    if (!onUpdateLogicRules) return;
    const defaultCondition =
      conditionOptions.length > 0 ? conditionOptions[0].value : "";
    const newRule: LogicRule = {
      condition_value: defaultCondition,
      action: "next",
      destination_question_id: null,
    };
    onUpdateLogicRules([...logicRules, newRule]);
  };

  const handleRuleChange = (
    index: number,
    updatedField: Partial<LogicRule>
  ) => {
    if (!onUpdateLogicRules) return;
    const updated = logicRules.map((rule, idx) => {
      if (idx !== index) return rule;
      const modified = { ...rule, ...updatedField };
      if (modified.action !== "jump") {
        modified.destination_question_id = null;
      }
      return modified;
    });
    onUpdateLogicRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    if (!onUpdateLogicRules) return;
    onUpdateLogicRules(logicRules.filter((_, idx) => idx !== index));
  };

  return (
    <aside className={styles.settingsPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.headerTitle}>Question</span>
      </div>

      <div className={styles.panelBody}>
        {/* Question Title / Text */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>Question Text</label>
          <textarea
            className={styles.textareaInput}
            value={activeQuestion.title || ""}
            onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
            onBlur={onBlur}
            placeholder="e.g. What is your favorite programming language?"
            rows={2}
          />
        </div>

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

        {/* Conditional Logic / Branching Section */}
        {supportsLogic && (
          <div className={styles.settingGroup}>
            <div className={styles.logicHeaderRow}>
              <label className={styles.settingLabel} style={{ marginBottom: 0 }}>
                Conditional Logic
              </label>
              <button
                type="button"
                className={styles.miniAddBtn}
                onClick={handleAddRule}
              >
                + Add Rule
              </button>
            </div>
            <div className={styles.settingSubtext} style={{ marginBottom: 8 }}>
              Direct respondents to different questions based on their answers.
            </div>

            {logicRules.length === 0 ? (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  padding: "8px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                }}
              >
                No branching rules. Form proceeds sequentially.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {logicRules.map((rule, rIdx) => {
                  const selectActionValue =
                    rule.action === "jump" && rule.destination_question_id
                      ? `jump_${rule.destination_question_id}`
                      : rule.action === "end"
                      ? "end"
                      : "next";

                  return (
                    <div key={rIdx} className={styles.logicCard}>
                      <div className={styles.logicCardHeader}>
                        <span className={styles.logicCardTitle}>Rule {rIdx + 1}</span>
                        <button
                          type="button"
                          className={styles.choiceRemoveBtn}
                          onClick={() => handleDeleteRule(rIdx)}
                          title="Remove rule"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Condition Selection */}
                      <div className={styles.logicRow}>
                        <span className={styles.logicSubLabel}>When answer is:</span>
                        <select
                          className={styles.selectInput}
                          value={rule.condition_value}
                          onChange={(e) =>
                            handleRuleChange(rIdx, { condition_value: e.target.value })
                          }
                        >
                          {conditionOptions.map((opt, oIdx) => (
                            <option key={oIdx} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Selection */}
                      <div className={styles.logicRow}>
                        <span className={styles.logicSubLabel}>Then:</span>
                        <select
                          className={styles.selectInput}
                          value={selectActionValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "next") {
                              handleRuleChange(rIdx, { action: "next", destination_question_id: null });
                            } else if (val === "end") {
                              handleRuleChange(rIdx, { action: "end", destination_question_id: null });
                            } else if (val.startsWith("jump_")) {
                              const targetId = parseInt(val.replace("jump_", ""), 10);
                              handleRuleChange(rIdx, {
                                action: "jump",
                                destination_question_id: targetId,
                              });
                            }
                          }}
                        >
                          <option value="next">Continue to next question</option>
                          <option value="end">End form (Complete)</option>
                          {siblingQuestions.length > 0 && (
                            <optgroup label="Jump to Question">
                              {siblingQuestions.map((sq) => {
                                const qNumber =
                                  allQuestions.findIndex((item) => item.id === sq.id) + 1;
                                const titleDisplay =
                                  sq.title.length > 25
                                    ? sq.title.slice(0, 25) + "..."
                                    : sq.title;
                                return (
                                  <option key={sq.id} value={`jump_${sq.id}`}>
                                    Jump to Q{qNumber}: {titleDisplay}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
