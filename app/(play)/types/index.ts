// ─── Participant / Player ─────────────────────────────────────────────────────

export interface Participant {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  user_id?: string | null;
}

export interface Player {
  id: string;
  name: string;
  image: string | null;
  answered: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  responses: any[];
  duration?: number;
}

// ─── Quiz / Session ───────────────────────────────────────────────────────────

export interface QuizData {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  questions?: any[];
  creator_name?: string;
  creator_avatar?: string | null;
  question_count?: number;
}

export interface GameSession {
  id: string;
  game_pin: string;
  status: "waiting" | "active" | "finished";
  host_id: string;
  total_time_minutes: number;
  game_end_mode: string;
  allow_join_after_start: boolean;
  question_limit?: string;
  participants?: any[];
  [key: string]: any;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  answer?: string;
  text?: string;
  option?: string;
  label?: string;
  image?: string | null;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  question: string;
  type?: string;
  image?: string | null;
  correct?: string;
  answers?: Answer[];
  options?: { id: string; text: string; key: string }[];
  [key: string]: any;
}

// ─── Join ─────────────────────────────────────────────────────────────────────

export interface JoinProps {
  initialPin?: string;
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export interface InviteProps {
  sessionId?: string;
}

export interface Friend {
  id: string;
  fullname: string | null;
  username: string;
  avatar_url?: string | null;
}

export interface Group {
  id: string;
  name: string;
  members: any[];
  member_count?: number;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface PlayerResponse {
  question_id: string;
  answer_id: string;
}

export interface PlayerWithResponses {
  id: string;
  name: string;
  responses: PlayerResponse[];
}
