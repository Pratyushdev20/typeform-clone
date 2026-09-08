"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Share2, Check, Upload, Download, Loader2 } from "lucide-react";
import { Form, CSVImportResponse } from "../../types";
import { useToast } from "../../context/ToastContext";
import { fetcher, getStoredToken } from "../../lib/api";
import styles from "./results.module.css";

interface ResultsHeaderProps {
  form: Form;
  totalResponses: number;
  onImportSuccess?: () => void;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  form,
  totalResponses,
  onImportSuccess,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/to/${form.slug || form.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Public form link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast(`Link: ${url}`, "info");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = getStoredToken();
      const res = await fetch(`${API_URL}/forms/${form.id}/export-csv`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let detail = "Failed to export CSV.";
        try {
          const err = await res.json();
          detail = err.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const blob = await res.blob();

      // Derive filename from Content-Disposition header if available
      const disposition = res.headers.get("Content-Disposition") || "";
      let filename = `${form.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/ /g, "_").toLowerCase() || `form_${form.id}`}_responses.csv`;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast("CSV exported successfully!", "success");
    } catch (err: any) {
      console.error("CSV export error:", err);
      showToast(err.message || "Failed to export CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToast("Please upload a valid .csv file.", "error");
      return;
    }

    try {
      setIsImporting(true);
      const csvText = await file.text();

      if (!csvText.trim()) {
        showToast("No responses found in this CSV file.", "error");
        setIsImporting(false);
        return;
      }

      const res: CSVImportResponse = await fetcher(`/forms/${form.id}/import-csv`, {
        method: "POST",
        body: JSON.stringify({ csv_content: csvText }),
      });

      showToast(
        res.message || `Successfully imported ${res.imported_count} response(s)!`,
        "success"
      );

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      console.error("CSV import error:", err);
      showToast(err.message || "Failed to import CSV responses.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <header className={styles.resultsHeader}>
      <div className={styles.headerInner}>
        {/* Left: Back Link & Form Title */}
        <div className={styles.headerLeft}>
          <Link
            href="/dashboard"
            className={styles.backBtn}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className={styles.titleWrapper}>
            <div className={styles.titleRow}>
              <h1 className={styles.formTitle} title={form.title}>
                {form.title}
              </h1>
              <span className={styles.responseCountBadge}>
                {totalResponses} {totalResponses === 1 ? "response" : "responses"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className={styles.headerActions}>
          {/* Hidden File Input for CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Import CSV Button */}
          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={handleImportClick}
            disabled={isImporting}
            title="Import form responses from CSV file"
          >
            {isImporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Import CSV</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            className={styles.exportCsvBtn}
            onClick={handleExportCSV}
            disabled={isExporting || totalResponses === 0}
            title={
              totalResponses === 0
                ? "No responses to export"
                : "Download all responses as a CSV file"
            }
            id="export-csv-btn"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export CSV{totalResponses === 0 ? " (No data)" : ""}</span>
              </>
            )}
          </button>

          {form.is_published && (
            <button
              type="button"
              className={styles.secondaryActionBtn}
              onClick={handleCopyLink}
              title="Copy public respondent link"
            >
              {copied ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
              <span>{copied ? "Copied Link" : "Share"}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={() => router.push(`/forms/${form.id}`)}
          >
            <Edit3 size={14} />
            <span>Open Builder</span>
          </button>
        </div>
      </div>
    </header>
  );
};
