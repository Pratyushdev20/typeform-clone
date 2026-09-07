"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "../../../../lib/api";
import { Form, Response, FormStats, Question } from "../../../../types";
import { ToastProvider } from "../../../../context/ToastContext";
import { ResultsHeader } from "../../../../components/results/ResultsHeader";
import { MetricsCards } from "../../../../components/results/MetricsCards";
import { SummaryAnalytics } from "../../../../components/results/SummaryAnalytics";
import { ResponsesTable } from "../../../../components/results/ResponsesTable";
import { ResponseDetailModal } from "../../../../components/results/ResponseDetailModal";
import { BarChart3, List, AlertCircle, RefreshCw } from "lucide-react";
import styles from "../../../../components/results/results.module.css";

function FormResultsContent() {
  const params = useParams();
  const formId = params?.id as string;
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'summary' | 'responses'
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");

  // Selected response for slide-out drawer
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number>(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!formId) return;
    try {
      setLoading(true);
      setError(null);

      const [formData, statsData, responsesData] = await Promise.all([
        fetcher(`/forms/${formId}`),
        fetcher(`/forms/${formId}/stats`),
        fetcher(`/forms/${formId}/responses`),
      ]);

      setForm(formData);
      setStats(statsData);
      setResponses(Array.isArray(responsesData) ? responsesData : []);
    } catch (err: any) {
      console.error("Failed to load results:", err);
      setError(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetails = (response: Response, index: number) => {
    setSelectedResponse(response);
    setSelectedSubmissionIndex(index);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbfbfb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#262627",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
            Loading responses &amp; analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbfbfb",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            textAlign: "center",
            backgroundColor: "#ffffff",
            padding: "2.5rem 2rem",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <AlertCircle size={36} style={{ color: "#dc2626", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Results Not Available
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
            {error || "Could not retrieve responses for this form."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              className={styles.secondaryActionBtn}
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={loadData}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questions: Question[] = form.questions || [];
  const latestSubmission = responses.length > 0 ? responses[responses.length - 1].submitted_at : null;

  return (
    <div className={styles.resultsPage}>
      {/* 1. Header */}
      <ResultsHeader form={form} totalResponses={responses.length} />

      {/* 2. Main Content */}
      <main className={styles.mainResultsContent}>
        {/* Top 4 Metrics Cards */}
        <MetricsCards
          totalResponses={responses.length}
          completionRate={responses.length > 0 ? 100 : 0}
          questionsCount={questions.length}
          latestSubmissionAt={latestSubmission}
        />

        {/* Tab Navigation */}
        <div className={styles.tabsContainer}>
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`${styles.tabBtn} ${
              activeTab === "summary" ? styles.tabBtnActive : ""
            }`}
          >
            <BarChart3 size={16} />
            <span>Summary &amp; Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("responses")}
            className={`${styles.tabBtn} ${
              activeTab === "responses" ? styles.tabBtnActive : ""
            }`}
          >
            <List size={16} />
            <span>All Responses ({responses.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "summary" && (
          <SummaryAnalytics questionStats={stats?.questions || []} />
        )}

        {activeTab === "responses" && (
          <ResponsesTable
            responses={responses}
            questions={questions}
            onViewDetails={handleViewDetails}
          />
        )}
      </main>

      {/* 3. Slide-out Response Detail Drawer */}
      <ResponseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        response={selectedResponse}
        responses={responses}
        questions={questions}
        submissionIndex={selectedSubmissionIndex}
        onNavigate={handleViewDetails}
      />
    </div>
  );
}

export default function FormResultsPage() {
  return (
    <ToastProvider>
      <FormResultsContent />
    </ToastProvider>
  );
}
