export enum QuestionType {
  short_text = "short_text",
  long_text = "long_text",
  multiple_choice = "multiple_choice",
  dropdown = "dropdown",
  email = "email",
  number = "number",
  yes_no = "yes_no",
  rating = "rating",
}

export interface QuestionOption {
  id: number;
  question_id: number;
  value: string;
  order_index: number;
}

export interface Question {
  id: number;
  form_id: number;
  title: string;
  description?: string;
  question_type: QuestionType;
  is_required: boolean;
  order_index: number;
  options: QuestionOption[];
}

export interface Form {
  id: number;
  slug: string;
  title: string;
  description?: string;
  is_published: boolean;
  thank_you_title?: string;
  thank_you_message?: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
  response_count?: number;
}

export interface Answer {
  id: number;
  response_id: number;
  question_id: number;
  text_value?: string;
  number_value?: number;
  boolean_value?: boolean;
}

export interface Response {
  id: number;
  form_id: number;
  submitted_at: string;
  answers: Answer[];
}

export interface QuestionStats {
  question_id: number;
  title: string;
  question_type: QuestionType;
  response_count: number;
  option_counts?: Record<string, number> | null;
  yes_no_counts?: { yes: number; no: number } | null;
  rating_stats?: {
    average: number;
    distribution: Record<string, number>;
    total_ratings: number;
  } | null;
  number_stats?: {
    min: number;
    max: number;
    average: number;
    count: number;
  } | null;
  text_answers?: string[] | null;
}

export interface FormStats {
  form_id: number;
  title: string;
  total_responses: number;
  questions: QuestionStats[];
}

