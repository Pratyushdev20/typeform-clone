"use client";

import React, { useState } from "react";
import styles from "./ContactsView.module.css";

export const ContactsView: React.FC = () => {
  const [search, setSearch] = useState("");

  return (
    <div className={styles.container}>
      {/* Header bar */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contacts</h1>
          <p className={styles.subtitle}>View and manage respondents across your workspace</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={() => alert("Import contacts dialog")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Import contacts</span>
          </button>
          <button className={styles.primaryBtn} onClick={() => alert("Add contact dialog")}>
            <span>+ Add contact</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Empty State */}
      <div className={styles.emptyCard}>
        <div className={styles.emptyIconWrapper}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h2 className={styles.emptyHeading}>No contacts yet</h2>
        <p className={styles.emptyText}>
          When people submit responses to your forms, their contact details and response history will appear here.
        </p>
        <div className={styles.emptyActions}>
          <button className={styles.importBtn} onClick={() => alert("Import contacts CSV")}>
            Import from CSV
          </button>
        </div>
      </div>
    </div>
  );
};
