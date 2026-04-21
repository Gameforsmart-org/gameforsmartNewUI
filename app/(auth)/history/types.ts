// ─── Core Types ───────────────────────────────────────────────────────────────

export type QuizActivityType = "host" | "player";

export type ViewMode = "grid" | "list";

export type SortOrder = "asc" | "desc";

export interface QuizHistory {
  id: string;
  quiztitle: string;
  ended_at: string;
  application: string;
  roles: QuizActivityType[];
  hostName?: string;
  hostUsername?: string;
  category?: string;
  language?: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export type TimeFilter =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

export interface FilterState {
  searchQuery: string;
  filterTime: TimeFilter;
  filterCategory: string;
  filterLanguage: string;
  sort: SortOrder;
}
