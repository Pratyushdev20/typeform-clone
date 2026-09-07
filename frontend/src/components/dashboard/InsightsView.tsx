"use client";

import React from "react";
import styles from "./InsightsView.module.css";

export const InsightsView: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
          </svg>
        </div>

        <h2 className={styles.heading}>Connect the dots across all your forms</h2>
        <p className={styles.description}>
          Combine responses from multiple forms to spot trends, compare audiences, and surface insights you&apos;d miss looking one form at a time
        </p>

        <div className={styles.actionButtons}>
          <button className={styles.upgradeBtn} onClick={() => alert("Upgrade plan modal")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
            </svg>
            <span>Upgrade plan</span>
          </button>
          <button className={styles.learnMoreBtn} onClick={() => alert("Learn more about Insights")}>
            Learn more
          </button>
        </div>

        <p className={styles.plansNotice}>
          Available on these plans: Talent, Business, Enterprise Basic, Enterprise, Growth Flow, Growth Custom, Growth Essentials
        </p>
      </div>
    </div>
  );
};
