"use client";

import React from "react";
import { Star } from "lucide-react";
import { QuestionStats } from "../../types";
import { getQuestionTypeLabel } from "../../lib/utils";
import styles from "./results.module.css";

interface SummaryAnalyticsProps {
  questionStats: QuestionStats[];
}

export const SummaryAnalytics: React.FC<SummaryAnalyticsProps> = ({
  questionStats,
}) => {
  if (questionStats.length === 0) {
    return (
      <div className={styles.noStatsMessage}>
        No question statistics available for this form.
      </div>
    );
  }

  return (
    <div className={styles.summaryList}>
      {questionStats.map((stat, idx) => (
        <div key={stat.question_id || idx} className={styles.statCard}>
          {/* Card Header */}
          <div className={styles.statCardHeader}>
            <div className={styles.statCardLeft}>
              <span className={styles.statIndexBadge}>{idx + 1}</span>
              <div>
                <h3 className={styles.statTitle}>{stat.title}</h3>
                <span className={styles.statTypeLabel}>
                  {getQuestionTypeLabel(stat.question_type)}
                </span>
              </div>
            </div>
            <span className={styles.statResponseBadge}>
              {stat.response_count} {stat.response_count === 1 ? "answer" : "answers"}
            </span>
          </div>

          {/* 1. Multiple Choice & Dropdown (Option Counts Bars) */}
          {(stat.question_type === "multiple_choice" ||
            stat.question_type === "dropdown") &&
            stat.option_counts && (
              <div className={styles.optionBarsList}>
                {Object.entries(stat.option_counts).map(([optionVal, count]) => {
                  const pct =
                    stat.response_count > 0
                      ? Math.round((count / stat.response_count) * 100)
                      : 0;
                  return (
                    <div key={optionVal} className={styles.optionBarItem}>
                      <div className={styles.optionBarTextRow}>
                        <span className={styles.optionLabel}>{optionVal}</span>
                        <span className={styles.optionCountText}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFillBlue}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* 2. Yes / No Split */}
          {stat.question_type === "yes_no" && stat.yes_no_counts && (
            <div>
              <div className={styles.yesNoLabelRow}>
                <span style={{ color: "#059669" }}>
                  Yes: {stat.yes_no_counts.yes || 0} (
                  {stat.response_count > 0
                    ? Math.round(
                        ((stat.yes_no_counts.yes || 0) / stat.response_count) * 100
                      )
                    : 0}
                  %)
                </span>
                <span style={{ color: "#dc2626" }}>
                  No: {stat.yes_no_counts.no || 0} (
                  {stat.response_count > 0
                    ? Math.round(
                        ((stat.yes_no_counts.no || 0) / stat.response_count) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className={styles.yesNoTrack}>
                <div
                  className={styles.yesNoFill}
                  style={{
                    width: `${
                      stat.response_count > 0
                        ? Math.round(
                            ((stat.yes_no_counts.yes || 0) / stat.response_count) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 3. Rating Scale Distribution */}
          {stat.question_type === "rating" && (
            <div>
              <div className={styles.ratingOverviewRow}>
                <div className={styles.ratingAverageBig}>
                  ★ {stat.rating_stats ? stat.rating_stats.average.toFixed(1) : "0.0"}
                </div>
                <div>
                  <div className={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        style={{
                          color: "#f59e0b",
                          fill:
                            stat.rating_stats &&
                            n <= Math.round(stat.rating_stats.average || 0)
                              ? "#f59e0b"
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className={styles.ratingSubtext}>
                    Average from {stat.rating_stats?.total_ratings || stat.response_count} ratings
                  </div>
                </div>
              </div>

              {stat.rating_stats && (
                <div className={styles.ratingDistList}>
                  {[5, 4, 3, 2, 1].map((r) => {
                    const count =
                      stat.rating_stats?.distribution[r.toString()] || 0;
                    const pct =
                      stat.rating_stats && stat.rating_stats.total_ratings > 0
                        ? Math.round(
                            (count / stat.rating_stats.total_ratings) * 100
                          )
                        : 0;
                    return (
                      <div key={r} className={styles.ratingDistRow}>
                        <span className={styles.distLabel}>{r} Stars</span>
                        <div className={styles.distTrack}>
                          <div
                            className={styles.barFillYellow}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={styles.distCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Number Stats (Min / Avg / Max) */}
          {stat.question_type === "number" && (
            <div className={styles.numberStatsGrid}>
              <div className={styles.numberStatBox}>
                <div className={styles.numberStatLabel}>MINIMUM</div>
                <div className={styles.numberStatVal}>
                  {stat.number_stats?.min !== undefined
                    ? stat.number_stats.min
                    : "-"}
                </div>
              </div>
              <div className={styles.numberStatBox}>
                <div
                  className={styles.numberStatLabel}
                  style={{ color: "#0445af" }}
                >
                  AVERAGE
                </div>
                <div
                  className={styles.numberStatVal}
                  style={{ color: "#0445af" }}
                >
                  {stat.number_stats?.average !== undefined
                    ? stat.number_stats.average.toFixed(1)
                    : "-"}
                </div>
              </div>
              <div className={styles.numberStatBox}>
                <div className={styles.numberStatLabel}>MAXIMUM</div>
                <div className={styles.numberStatVal}>
                  {stat.number_stats?.max !== undefined
                    ? stat.number_stats.max
                    : "-"}
                </div>
              </div>
            </div>
          )}

          {/* 5. Text / Email Responses List */}
          {(stat.question_type === "short_text" ||
            stat.question_type === "long_text" ||
            stat.question_type === "email") && (
            <div>
              {stat.text_answers && stat.text_answers.length > 0 ? (
                <div className={styles.textAnswersScroll}>
                  {stat.text_answers.map((ans, aIdx) => (
                    <div key={aIdx} className={styles.textAnswerBubble}>
                      {ans}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noAnswersText}>
                  No text answers recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
