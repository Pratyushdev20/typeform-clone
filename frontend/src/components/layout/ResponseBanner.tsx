"use client";

import React, { useState } from "react";
import styles from "./ResponseBanner.module.css";

interface ResponseBannerProps {
  onGetMore?: () => void;
}

export const ResponseBanner: React.FC<ResponseBannerProps> = ({ onGetMore }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.diamondIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
            </svg>
          </div>
          <p className={styles.bannerText}>
            You can collect <strong className={styles.strongText}>10 form responses</strong> this month for free.
          </p>
          <button
            className={styles.ctaButton}
            onClick={onGetMore}
          >
            Get more responses
          </button>
        </div>
        <button
          className={styles.closeButton}
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss banner"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};
