import { QuestionType } from "../../types";

export interface QuestionTypeConfig {
  type: QuestionType;
  label: string;
  category: "Text" | "Contact" | "Choice" | "Rating & Numbers";
  icon: string;
  badgeBg: string;
  badgeColor: string;
  defaultTitle: string;
  defaultDescription: string;
}

export const QUESTION_TYPE_CONFIGS: Record<QuestionType, QuestionTypeConfig> = {
  [QuestionType.short_text]: {
    type: QuestionType.short_text,
    label: "Short Text",
    category: "Text",
    icon: "📝",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    defaultTitle: "What is your name?",
    defaultDescription: "Please enter a short answer.",
  },
  [QuestionType.long_text]: {
    type: QuestionType.long_text,
    label: "Long Text",
    category: "Text",
    icon: "📄",
    badgeBg: "#f0fdf4",
    badgeColor: "#15803d",
    defaultTitle: "Please share your thoughts or feedback in detail",
    defaultDescription: "Feel free to write as much as you like.",
  },
  [QuestionType.multiple_choice]: {
    type: QuestionType.multiple_choice,
    label: "Multiple Choice",
    category: "Choice",
    icon: "🔘",
    badgeBg: "#f3e8ff",
    badgeColor: "#7e22ce",
    defaultTitle: "Which option best describes you?",
    defaultDescription: "Select one choice.",
  },
  [QuestionType.dropdown]: {
    type: QuestionType.dropdown,
    label: "Dropdown",
    category: "Choice",
    icon: "🔽",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    defaultTitle: "Select your country / region",
    defaultDescription: "Choose from the dropdown list.",
  },
  [QuestionType.email]: {
    type: QuestionType.email,
    label: "Email",
    category: "Contact",
    icon: "✉️",
    badgeBg: "#ffe4e6",
    badgeColor: "#be123c",
    defaultTitle: "What is your email address?",
    defaultDescription: "We will only use this to get in touch.",
  },
  [QuestionType.number]: {
    type: QuestionType.number,
    label: "Number",
    category: "Rating & Numbers",
    icon: "#️⃣",
    badgeBg: "#e0e7ff",
    badgeColor: "#4338ca",
    defaultTitle: "How many people are on your team?",
    defaultDescription: "Enter a number.",
  },
  [QuestionType.yes_no]: {
    type: QuestionType.yes_no,
    label: "Yes / No",
    category: "Choice",
    icon: "👍",
    badgeBg: "#f1f5f9",
    badgeColor: "#334155",
    defaultTitle: "Do you agree with our terms and policy?",
    defaultDescription: "",
  },
  [QuestionType.rating]: {
    type: QuestionType.rating,
    label: "Rating",
    category: "Rating & Numbers",
    icon: "⭐",
    badgeBg: "#fef9c3",
    badgeColor: "#854d0e",
    defaultTitle: "How would you rate your overall experience?",
    defaultDescription: "1 is lowest, 5 is highest.",
  },
};
