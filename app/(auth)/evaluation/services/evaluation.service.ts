import { supabase } from "@/lib/supabase";
import type { PeriodFilter, PeriodStats, QuizStat, SessionData } from "../types";

// ─────────────────────────────────────────────
// Date Range Helpers
// ─────────────────────────────────────────────

export function getDateRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;

    case "this_week": {
      const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case "last_week": {
      const diff = now.getDay() === 0 ? 13 : now.getDay() + 6;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
      const endLastWeek = new Date(start);
      endLastWeek.setDate(start.getDate() + 6);
      endLastWeek.setHours(23, 59, 59, 999);
      return { start, end: endLastWeek };
    }

    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end.setFullYear(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "this_year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "last_year":
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    case "all":
    default:
      start = new Date(2020, 0, 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function getPreviousPeriodRange(
  period: PeriodFilter
): { start: Date; end: Date } | null {
  const now = new Date();

  switch (period) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0),
        end:   new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
      };

    case "yesterday":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0),
        end:   new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999)
      };

    case "this_week": {
      const diff = now.getDay() === 0 ? 13 : now.getDay() + 6;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
      const end   = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "last_week": {
      const diff = now.getDay() === 0 ? 20 : now.getDay() + 13;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
      const end   = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "this_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
        end:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      };

    case "last_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0),
        end:   new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
      };

    case "this_year":
      return {
        start: new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0),
        end:   new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      };

    case "last_year":
      return {
        start: new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0),
        end:   new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999)
      };

    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// Read — Evaluation Dashboard
// ─────────────────────────────────────────────

/**
 * Ambil statistik sesi untuk satu periode tertentu.
 */
export async function fetchPeriodStats(
  profileId: string,
  start: Date,
  end: Date
): Promise<PeriodStats> {
  const { data: sessionsData, error } = await supabase
    .from("game_sessions")
    .select(`id, quiz_id, started_at, ended_at, participants, application, quizzes (id, title)`)
    .not("ended_at", "is", null)
    .eq("status", "finished")
    .gte("ended_at", start.toISOString())
    .lte("ended_at", end.toISOString());

  if (error) {
    console.error(error);
    return { totalGames: 0, avgScore: 0, uniqueQuizzes: 0, sessionsData: [] };
  }

  let totalParticipations = 0;
  let totalScoreSum = 0;
  const quizIds = new Set<string>();

  (sessionsData || []).forEach((session: any) => {
    const userParticipation = (session.participants || []).find(
      (p: any) => p.user_id === profileId
    );

    if (userParticipation) {
      totalParticipations++;
      totalScoreSum += userParticipation.score || 0;

      const quizTitle = Array.isArray(session.quizzes)
        ? session.quizzes[0]?.title
        : session.quizzes?.title;
      quizIds.add(session.quiz_id || quizTitle || "unknown");
    }
  });

  return {
    totalGames:    totalParticipations,
    avgScore:      totalParticipations > 0 ? Math.round(totalScoreSum / totalParticipations) : 0,
    uniqueQuizzes: quizIds.size,
    sessionsData:  sessionsData || []
  };
}

/**
 * Bangun array top quizzes dari sessionsData yang sudah difetch.
 */
export function buildTopQuizzes(sessionsData: any[], profileId: string): QuizStat[] {
  const quizStatsMap = new Map<
    string,
    { title: string; count: number; totalScore: number; participantCount: number }
  >();

  sessionsData.forEach((session: any) => {
    const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;
    const quizTitle = quiz?.title || "Unknown Quiz";
    const quizId    = session.quiz_id || quizTitle;

    const userParticipation = (session.participants || []).find(
      (p: any) => p.user_id === profileId
    );

    if (!userParticipation) return;

    const existing = quizStatsMap.get(quizId);
    if (existing) {
      existing.count++;
      if (userParticipation.score !== undefined) {
        existing.totalScore      += userParticipation.score;
        existing.participantCount++;
      }
    } else {
      quizStatsMap.set(quizId, {
        title:            quizTitle,
        count:            1,
        totalScore:       userParticipation.score || 0,
        participantCount: userParticipation.score !== undefined ? 1 : 0
      });
    }
  });

  return Array.from(quizStatsMap.entries())
    .map(([id, stats]) => ({
      id,
      name:     stats.title,
      plays:    stats.count,
      avgScore: stats.participantCount > 0
        ? Math.round(stats.totalScore / stats.participantCount)
        : 0
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)
    .map((q, i) => ({ ...q, rank: i + 1 }));
}

// ─────────────────────────────────────────────
// Read — Quiz Detail [id]
// ─────────────────────────────────────────────

/**
 * Ambil judul quiz berdasarkan ID.
 */
export async function fetchQuizTitle(quizId: string): Promise<string> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("title")
    .eq("id", quizId)
    .single();

  if (error) {
    console.error("Error fetching quiz title:", error);
    return "Unknown Quiz";
  }
  return data?.title || "Unknown Quiz";
}

/**
 * Ambil semua sesi permainan untuk quiz tertentu dalam rentang waktu.
 */
export async function fetchQuizSessions(
  quizId: string,
  profileId: string,
  start: Date,
  end: Date
): Promise<SessionData[]> {
  const { data: sessionsData, error } = await supabase
    .from("game_sessions")
    .select(`id, started_at, ended_at, participants, application`)
    .eq("quiz_id", quizId)
    .not("started_at", "is", null)
    .not("ended_at", "is", null)
    .gte("started_at", start.toISOString())
    .lte("started_at", end.toISOString())
    .order("started_at", { ascending: false });

  if (error) throw error;

  const result: SessionData[] = [];

  (sessionsData || []).forEach((session: any) => {
    const participants      = session.participants || [];
    const userParticipation = participants.find((p: any) => p.user_id === profileId);

    if (!userParticipation) return;

    const highestScore = participants.reduce(
      (max: number, p: any) => Math.max(max, p.score || 0),
      0
    );

    result.push({
      session_id:        session.id,
      participant_id:    userParticipation.id,
      play_date:         session.started_at,
      user_score:        userParticipation.score || 0,
      highest_score:     highestScore,
      application:       session.application || "unknown",
      participant_count: participants.length
    });
  });

  return result;
}
