// ============================================================
// _types/index.ts
// Shared type definitions for the Edit Quiz feature
// ============================================================

export interface Answer {
  id: string;
  text: string;
  color: string;
  image_url?: string | null;
}

export interface Question {
  id: string;
  text: string;
  timeLimit: number;
  image_url?: string | null;
  answers: Answer[];
  correct: string; // answer id (index string)
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  is_public: boolean;
  image_url: string | null;
  questions: Question[];
}
