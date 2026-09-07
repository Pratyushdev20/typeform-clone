"use client";

import React, { useState } from "react";
import styles from "./SuggestionCards.module.css";

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  defaultFormTitle: string;
}

interface SuggestionCardsProps {
  onUseSuggestion: (suggestion: SuggestionItem) => void;
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  {
    id: "card_1",
    title: "Request Prioritization",
    description:
      "Create a Streamline submission and prioritization of requests for efficient handling and response.",
    defaultFormTitle: "Request Prioritization Form",
  },
  {
    id: "card_2",
    title: "Milestone Monitor",
    description:
      "Create a Monitor milestones and team updates to keep projects on schedule and transparent.",
    defaultFormTitle: "Project Milestone Tracker",
  },
];

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({
  onUseSuggestion,
}) => {
  const [cards, setCards] = useState<SuggestionItem[]>(DEFAULT_SUGGESTIONS);

  const handleDismiss = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  if (cards.length === 0) return null;

  return (
    <div className={styles.suggestionsContainer}>
      {cards.map((card) => (
        <div key={card.id} className={styles.card}>
          <button
            className={styles.closeBtn}
            onClick={() => handleDismiss(card.id)}
            title="Dismiss suggestion"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <p className={styles.cardDescription}>{card.description}</p>
          </div>

          <div className={styles.cardAction}>
            <button
              className={styles.useFormBtn}
              onClick={() => onUseSuggestion(card)}
            >
              Use this form
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
