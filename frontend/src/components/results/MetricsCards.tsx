"use client";

import React from "react";
import { Users, CheckCircle, HelpCircle, Clock } from "lucide-react";
import { formatTimeAgo } from "../../lib/utils";
import styles from "./results.module.css";

interface MetricsCardsProps {
  totalResponses: number;
  completionRate: number;
  questionsCount: number;
  latestSubmissionAt?: string | null;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  totalResponses,
  completionRate,
  questionsCount,
  latestSubmissionAt,
}) => {
  const metrics = [
    {
      title: "Total Responses",
      value: totalResponses.toString(),
      icon: <Users size={18} style={{ color: "#0445af" }} />,
      bg: "#eef4ff",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: <CheckCircle size={18} style={{ color: "#059669" }} />,
      bg: "#ecfdf5",
    },
    {
      title: "Questions Tracked",
      value: questionsCount.toString(),
      icon: <HelpCircle size={18} style={{ color: "#6366f1" }} />,
      bg: "#eef2ff",
    },
    {
      title: "Most Recent Submission",
      value: formatTimeAgo(latestSubmissionAt),
      icon: <Clock size={18} style={{ color: "#d97706" }} />,
      bg: "#fffbeb",
    },
  ];

  return (
    <div className={styles.metricsGrid}>
      {metrics.map((m, i) => (
        <div key={i} className={styles.metricCard}>
          <div
            className={styles.metricIconBox}
            style={{ backgroundColor: m.bg }}
          >
            {m.icon}
          </div>
          <div>
            <div className={styles.metricTitle}>{m.title}</div>
            <div className={styles.metricValue}>{m.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
