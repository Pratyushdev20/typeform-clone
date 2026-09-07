"use client";

import React, { useState } from "react";
import styles from "./WorkspaceHeader.module.css";

export type SortOption = "date_desc" | "date_asc" | "title_asc" | "title_desc" | "responses_desc";
export type ViewMode = "list" | "grid";

interface WorkspaceHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateClick?: () => void;
  onInviteClick?: () => void;
  onWorkspaceOptionsClick?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onCreateClick,
  onInviteClick,
  onWorkspaceOptionsClick,
  onToggleMobileSidebar,
}) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "date_desc":
        return "Date created";
      case "date_asc":
        return "Oldest first";
      case "title_asc":
        return "Name (A-Z)";
      case "title_desc":
        return "Name (Z-A)";
      case "responses_desc":
        return "Most responses";
      default:
        return "Date created";
    }
  };

  return (
    <div className={styles.workspaceHeader}>
      <div className={styles.leftGroup}>
        {onToggleMobileSidebar && (
          <button
            className={styles.mobileMenuBtn}
            onClick={onToggleMobileSidebar}
            title="Open workspace sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <h1 className={styles.title}>My workspace</h1>
        
        <button
          className={styles.moreOptionsBtn}
          onClick={onWorkspaceOptionsClick}
          title="Workspace options"
        >
          •••
        </button>

        <button className={styles.inviteBtn} onClick={onInviteClick}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span>Invite</span>
          <span className={styles.gemIcon}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
            </svg>
          </span>
        </button>
      </div>

      <div className={styles.rightGroup}>
        {/* Sort Dropdown */}
        <div className={styles.sortContainer}>
          <button
            className={styles.sortButton}
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{getSortLabel(sortBy)}</span>
            <svg
              className={`${styles.chevron} ${isSortMenuOpen ? styles.chevronOpen : ""}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isSortMenuOpen && (
            <div className={styles.sortMenu}>
              {(["date_desc", "date_asc", "title_asc", "title_desc", "responses_desc"] as SortOption[]).map((option) => (
                <button
                  key={option}
                  className={`${styles.sortMenuItem} ${sortBy === option ? styles.sortMenuItemActive : ""}`}
                  onClick={() => {
                    onSortChange(option);
                    setIsSortMenuOpen(false);
                  }}
                >
                  <span>{getSortLabel(option)}</span>
                  {sortBy === option && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className={styles.viewToggleGroup}>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => onViewModeChange("list")}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>List</span>
          </button>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Grid</span>
          </button>
        </div>

        {/* Top-Right Create Form Button */}
        {onCreateClick && (
          <button className={styles.headerCreateBtn} onClick={onCreateClick}>
            <span className={styles.plusIcon}>+</span>
            <span>Create form</span>
          </button>
        )}
      </div>
    </div>
  );
};
