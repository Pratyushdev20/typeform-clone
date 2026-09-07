"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "../../../../lib/api";
import { Form, Response, FormStats, QuestionType } from "../../../../types";
import styles from "./results.module.css";

export default function FormResultsPage() {
  const params = useParams();
  const formId = params?.id as string;
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: "analytics" | "responses"
  const [activeTab, setActiveTab] = useState<"analytics" | "responses">("analytics");

  // Selected response for individual modal view
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (!formId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch Form metadata, statistics, and responses in parallel
      const [formData, statsData, responsesData] = await Promise.all([
        fetcher(`/forms/${formId}`),
        fetcher(`/forms/${formId}/stats`),
        fetcher(`/forms/${formId}/responses`),
      ]);

      setForm(formData);
      setStats(statsData);
      setResponses(responsesData);
    } catch (err: any) {
      console.error("Failed to load results data:", err);
      setError(err.message || "Failed to load results data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]);

  const handleCopyLink = () => {
    if (!form) return;
    const url = `${window.location.origin}/to/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Helper to format an answer value cleanly
  const formatAnswerValue = (ans?: {
    text_value?: string;
    number_value?: number;
    boolean_value?: boolean;
  }) => {
    if (!ans) return <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No answer</span>;
    if (ans.boolean_value !== undefined && ans.boolean_value !== null) {
      return ans.boolean_value ? "Yes" : "No";
    }
    if (ans.number_value !== undefined && ans.number_value !== null) {
      return ans.number_value.toString();
    }
    if (ans.text_value !== undefined && ans.text_value !== null && ans.text_value.trim() !== "") {
      return ans.text_value;
    }
    return <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No answer</span>;
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div style={{ fontSize: "1.5rem", fontWeight: 500 }}>Loading Results & Analytics...</div>
        <p style={{ color: "var(--muted)" }}>Analyzing responses</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className={styles.centerContainer}>
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <h2>Error Loading Results</h2>
        <p style={{ color: "var(--danger)" }}>{error || "Form not found"}</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={() => router.push("/")}>
            Back to Workspace
          </button>
          <button className="btn btn-primary" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalResponses = responses.length;

  return (
    <div className={styles.resultsContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              ← Workspace
            </Link>
            <span style={{ color: "var(--border)" }}>/</span>
            <Link href={`/forms/${form.id}`} className={styles.navLink}>
              ✎ Form Builder
            </Link>
          </div>

          <div className={styles.headerActions}>
            {form.is_published && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
                onClick={handleCopyLink}
              >
                {copied ? "✓ Copied Link!" : "🔗 Share Link"}
              </button>
            )}
            <Link
              href={`/forms/${form.id}`}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
            >
              Edit Form
            </Link>
          </div>
        </div>

        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>{form.title}</h1>
          <span className={styles.responseCountBadge}>
            {totalResponses} {totalResponses === 1 ? "Response" : "Responses"}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "analytics" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Summary & Analytics
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "responses" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("responses")}
          >
            📋 All Responses ({totalResponses})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.contentArea}>
        {/* Top Metric Cards */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Responses</span>
            <span className={styles.metricValue}>{totalResponses}</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Completion Rate</span>
            <span className={styles.metricValue}>
              {totalResponses > 0 ? "100%" : "0%"}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Questions Tracked</span>
            <span className={styles.metricValue}>{form.questions?.length || 0}</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Last Submission</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--foreground)" }}>
              {totalResponses > 0
                ? formatDate(responses[responses.length - 1].submitted_at)
                : "No submissions yet"}
            </span>
          </div>
        </div>

        {/* EMPTY STATE */}
        {totalResponses === 0 && (
          <div className={styles.emptyCard}>
            <div style={{ fontSize: "3rem" }}>📭</div>
            <h2 className={styles.emptyTitle}>No responses received yet</h2>
            <p className={styles.emptyDesc}>
              Share your public form URL to start gathering answers and visual analytics in real-time.
            </p>
            {form.is_published ? (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <a
                  href={`/to/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open Public Form ↗
                </a>
                <button type="button" className="btn btn-secondary" onClick={handleCopyLink}>
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            ) : (
              <Link href={`/forms/${form.id}`} className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Publish Form in Builder
              </Link>
            )}
          </div>
        )}

        {/* 1. ANALYTICS / SUMMARY TAB */}
        {totalResponses > 0 && activeTab === "analytics" && (
          <div className={styles.statsSection}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>Question Breakdown</h2>

            {stats?.questions.map((qStat, idx) => {
              return (
                <div key={qStat.question_id} className={styles.questionStatCard}>
                  <div className={styles.qHeader}>
                    <div className={styles.qLeft}>
                      <span className={styles.qIndex}>{idx + 1}</span>
                      <div>
                        <div className={styles.qTitle}>{qStat.title}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={styles.qTypeBadge}>{qStat.question_type}</span>
                      <span className={styles.qCountBadge}>
                        {qStat.response_count} {qStat.response_count === 1 ? "answer" : "answers"}
                      </span>
                    </div>
                  </div>

                  {/* Multiple Choice & Dropdown (Option counts bar chart) */}
                  {qStat.option_counts && (
                    <div className={styles.barsContainer}>
                      {Object.entries(qStat.option_counts).map(([optionVal, count]) => {
                        const percent =
                          qStat.response_count > 0
                            ? Math.round((count / qStat.response_count) * 100)
                            : 0;

                        return (
                          <div key={optionVal} className={styles.barRow}>
                            <div className={styles.barLabelRow}>
                              <span>{optionVal}</span>
                              <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                                {count} ({percent}%)
                              </span>
                            </div>
                            <div className={styles.barTrack}>
                              <div
                                className={styles.barFill}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Yes / No Breakdown */}
                  {qStat.yes_no_counts && (
                    <div className={styles.barsContainer}>
                      <div className={styles.barRow}>
                        <div className={styles.barLabelRow}>
                          <span style={{ color: "#166534", fontWeight: 600 }}>Yes</span>
                          <span style={{ color: "var(--muted)" }}>
                            {qStat.yes_no_counts.yes} (
                            {qStat.response_count > 0
                              ? Math.round((qStat.yes_no_counts.yes / qStat.response_count) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${
                                qStat.response_count > 0
                                  ? Math.round(
                                      (qStat.yes_no_counts.yes / qStat.response_count) * 100
                                    )
                                  : 0
                              }%`,
                              background: "#10b981",
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.barRow}>
                        <div className={styles.barLabelRow}>
                          <span style={{ color: "#991b1b", fontWeight: 600 }}>No</span>
                          <span style={{ color: "var(--muted)" }}>
                            {qStat.yes_no_counts.no} (
                            {qStat.response_count > 0
                              ? Math.round((qStat.yes_no_counts.no / qStat.response_count) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${
                                qStat.response_count > 0
                                  ? Math.round(
                                      (qStat.yes_no_counts.no / qStat.response_count) * 100
                                    )
                                  : 0
                              }%`,
                              background: "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rating Breakdown */}
                  {qStat.rating_stats && (
                    <div className={styles.ratingContainer}>
                      <div className={styles.ratingOverview}>
                        <span className={styles.ratingScore}>
                          ★ {qStat.rating_stats.average.toFixed(1)}
                        </span>
                        <span className={styles.ratingMax}>
                          / 5 average rating ({qStat.rating_stats.total_ratings} ratings)
                        </span>
                      </div>

                      <div className={styles.barsContainer}>
                        {[5, 4, 3, 2, 1].map((ratingVal) => {
                          const count = qStat.rating_stats?.distribution[ratingVal.toString()] || 0;
                          const percent =
                            qStat.rating_stats && qStat.rating_stats.total_ratings > 0
                              ? Math.round((count / qStat.rating_stats.total_ratings) * 100)
                              : 0;

                          return (
                            <div key={ratingVal} className={styles.barRow}>
                              <div className={styles.barLabelRow}>
                                <span>{ratingVal} Stars</span>
                                <span style={{ color: "var(--muted)" }}>
                                  {count} ({percent}%)
                                </span>
                              </div>
                              <div className={styles.barTrack}>
                                <div
                                  className={styles.barFill}
                                  style={{ width: `${percent}%`, background: "#f59e0b" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Number Breakdown */}
                  {qStat.number_stats && (
                    <div className={styles.numberChipsRow}>
                      <div className={styles.numberChip}>
                        <span className={styles.chipLabel}>Minimum</span>
                        <span className={styles.chipValue}>{qStat.number_stats.min}</span>
                      </div>
                      <div className={styles.numberChip}>
                        <span className={styles.chipLabel}>Average</span>
                        <span className={styles.chipValue}>
                          {qStat.number_stats.average.toFixed(1)}
                        </span>
                      </div>
                      <div className={styles.numberChip}>
                        <span className={styles.chipLabel}>Maximum</span>
                        <span className={styles.chipValue}>{qStat.number_stats.max}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Answers (Short text, Long text, Email) */}
                  {qStat.text_answers && (
                    <div className={styles.textAnswersList}>
                      {qStat.text_answers.length > 0 ? (
                        qStat.text_answers.map((txt, aIdx) => (
                          <div key={aIdx} className={styles.textAnswerItem}>
                            &ldquo;{txt}&rdquo;
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
                          No text submissions recorded.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. RESPONSES TABLE TAB */}
        {totalResponses > 0 && activeTab === "responses" && (
          <div className={styles.tableCard}>
            <table className={styles.responsesTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Submission Date</th>
                  <th>Answers Preview</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((resp, idx) => {
                  const firstTextAnswer = resp.answers.find(
                    (a) => a.text_value && a.text_value.trim() !== ""
                  );

                  return (
                    <tr key={resp.id}>
                      <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                      <td>{formatDate(resp.submitted_at)}</td>
                      <td style={{ color: "var(--muted)", maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {firstTextAnswer ? firstTextAnswer.text_value : `${resp.answers.length} fields completed`}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.viewDetailBtn}
                          onClick={() => setSelectedResponse(resp)}
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Individual Response Modal */}
      {selectedResponse && (
        <div className={styles.modalOverlay} onClick={() => setSelectedResponse(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Response #{selectedResponse.id}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Submitted on {formatDate(selectedResponse.submitted_at)}
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedResponse(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {form.questions?.map((q, idx) => {
                const answer = selectedResponse.answers.find((a) => a.question_id === q.id);

                return (
                  <div key={q.id} className={styles.answerBlock}>
                    <span className={styles.answerQTitle}>
                      {idx + 1}. {q.title}
                    </span>
                    <div className={styles.answerValue}>{formatAnswerValue(answer)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
