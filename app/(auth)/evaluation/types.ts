// ─── Period / Filter ──────────────────────────────────────────────────────────

export type PeriodFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all";

// ─── Evaluation Stats ─────────────────────────────────────────────────────────

export interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
}

export interface PeriodStats {
  totalGames: number;
  avgScore: number;
  uniqueQuizzes: number;
  sessionsData: any[];
}

// ─── Top Quizzes ──────────────────────────────────────────────────────────────

export interface QuizStat {
  id: string;
  rank: number;
  name: string;
  plays: number;
  avgScore: number;
}

// ─── Quiz Detail / [id] ───────────────────────────────────────────────────────

export interface SessionData {
  session_id: string;
  participant_id: string;
  play_date: string;
  user_score: number;
  highest_score: number;
  application: string;
  participant_count: number;
}

export interface ApplicationInfo {
  name: string;
  shortName: string;
  colorClass: string;
}
