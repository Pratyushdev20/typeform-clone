"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Share2, Check } from "lucide-react";
import { Form } from "../../types";
import { useToast } from "../../context/ToastContext";
import styles from "./results.module.css";

interface ResultsHeaderProps {
  form: Form;
  totalResponses: number;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  form,
  totalResponses,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

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
