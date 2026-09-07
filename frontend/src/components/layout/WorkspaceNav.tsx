"use client";

import React from "react";
import styles from "./WorkspaceNav.module.css";

export type NavTab = "forms" | "contacts" | "insights";

interface WorkspaceNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className={styles.navContainer}>
      <div className={styles.tabsList}>
        <button
          className={`${styles.tabBtn} ${activeTab === "forms" ? styles.tabBtnActive : ""}`}
          onClick={() => onTabChange("forms")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="14" y1="9" x2="18" y2="9"></line>
            <line x1="14" y1="13" x2="18" y2="13"></line>
            <line x1="14" y1="17" x2="18" y2="17"></line>
          </svg>
          <span>Forms</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "contacts" ? styles.tabBtnActive : ""}`}
          onClick={() => onTabChange("contacts")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Contacts</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "insights" ? styles.tabBtnActive : ""}`}
          onClick={() => onTabChange("insights")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Insights</span>
          <span className={styles.gemIcon}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
            </svg>
          </span>
        </button>
      </div>
    </nav>
  );
};
