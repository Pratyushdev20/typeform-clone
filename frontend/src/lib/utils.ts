import { Question, QuestionType } from "../types";

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Recently";
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return formatDate(dateString);
  } catch {
    return "Recently";
  }
}

export function getQuestionTypeLabel(type: QuestionType | string): string {
  const labels: Record<string, string> = {
    short_text: "Short Text",
    long_text: "Long Text",
    multiple_choice: "Multiple Choice",
    dropdown: "Dropdown",
    email: "Email",
    number: "Number",
    yes_no: "Yes / No",
    rating: "Rating",
  };
  return labels[type] || type;
}
