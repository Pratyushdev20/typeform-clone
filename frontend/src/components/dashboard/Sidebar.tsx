"use client";

import React, { useState } from "react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  formCount: number;
  totalResponses: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  onUpgradeClick?: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  formCount,
  totalResponses,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onUpgradeClick,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);

  const limitMax = 10;
  const progressPercent = Math.min(100, Math.round((totalResponses / limitMax) * 100));

  return (
    <>
      {isOpenOnMobile && (
        <div className={styles.mobileBackdrop} onClick={onCloseMobile} />
      )}
      <aside className={`${styles.sidebar} ${isOpenOnMobile ? styles.sidebarOpenMobile : ""}`}>
        {/* Primary Create form CTA */}
        <div className={styles.topActionSection}>
          <button className={styles.createFormBtn} onClick={onCreateClick}>
            <span className={styles.plusIcon}>+</span>
            <span>Create form</span>
          </button>
        </div>

        {/* Search Input */}
        <div className={styles.searchSection}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => onSearchChange("")}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Workspaces Section */}
        <div className={styles.workspaceSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleLeft}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>
              <span className={styles.sectionTitle}>Workspaces</span>
            </div>
            <button
              className={styles.addWorkspaceBtn}
              title="Add workspace"
              onClick={() => alert("Add workspace")}
            >
              +
            </button>
          </div>

          <div className={styles.folderGroup}>
            <button
              className={styles.groupHeader}
              onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
            >
              <span className={styles.groupTitle}>Private</span>
              <svg
                className={`${styles.chevron} ${!isPrivateExpanded ? styles.chevronCollapsed : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            {isPrivateExpanded && (
              <div className={styles.workspaceList}>
                <button className={`${styles.workspaceItem} ${styles.workspaceItemActive}`}>
                  <span className={styles.workspaceItemName}>My workspace</span>
                  <span className={styles.workspaceItemCount}>{formCount}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Usage Section */}
        <div className={styles.sidebarBottom}>
          <div className={styles.usageCard}>
            <div className={styles.usageLabel}>Responses collected</div>
            <div className={styles.usageBarTrack}>
              <div
                className={styles.usageBarFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className={styles.usageCount}>
              {totalResponses} / {limitMax}
            </div>
            <button
              className={styles.increaseLimitBtn}
              onClick={onUpgradeClick}
            >
              Increase response limit
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
