import { createClient } from "@/lib/supabase-server";
import type { QuizHistory, QuizActivityType } from "../types";

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

/**
 * Ambil riwayat quiz milik user yang sedang login.
 * Mencakup sesi sebagai host maupun participant.
 */
export async function getQuizHistory(): Promise<QuizHistory[]> {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Resolve profile XID dari auth user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return [];

  const profileId = (profile as any).id;

  // Ambil semua finished sessions yang melibatkan user (sebagai host atau participant)
  const { data: sessions, error } = await supabase
    .from("game_sessions")
    .select("id, host_id, ended_at, application, participants, quizzes(title), quiz_detail")
    .eq("status", "finished")
    .or(`host_id.eq.${profileId},participants.cs.[{"user_id":"${profileId}"}]`)
    .order("ended_at", { ascending: false });

  if (error || !sessions) {
    console.error("Error fetching history:", error);
    return [];
  }

  // Batch fetch semua host profiles sekaligus
  const hostIds = Array.from(
    new Set(sessions.map((s: any) => s.host_id).filter(Boolean))
  );

  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, fullname, nickname, username")
    .in("id", hostIds);

  // Build lookup maps
  const hostNameMap: Record<string, string> = {};
  const hostUsernameMap: Record<string, string> = {};
  hosts?.forEach((h: any) => {
    hostNameMap[h.id]     = h.fullname || h.nickname || "Unknown Host";
    hostUsernameMap[h.id] = h.username || "";
  });

  // Map sessions → QuizHistory
  const results: QuizHistory[] = [];

  for (const sessionData of sessions) {
    const session: any = sessionData;

    const isHost        = session.host_id === profileId;
    const participants  = Array.isArray(session.participants) ? session.participants : [];
    const isParticipant = participants.some((p: any) => p.user_id === profileId);

    // Resolve quiz title (dengan fallback ke quiz_detail)
    const quiztitle =
      (session.quizzes as any)?.title ||
      (session.quiz_detail as any)?.title ||
      "Unknown Quiz";

    const quizDetail = session.quiz_detail as any;

    const roles: QuizActivityType[] = [];
    if (isHost)        roles.push("host");
    if (isParticipant) roles.push("player");

    if (roles.length === 0) continue;

    results.push({
      id:          session.id,
      quiztitle,
      ended_at:    session.ended_at || new Date().toISOString(),
      application: session.application || "Unknown Application",
      roles,
      category:    quizDetail?.category || "",
      language:    quizDetail?.language || "",
      hostName:     isParticipant ? (hostNameMap[session.host_id]     || "Unknown Host") : undefined,
      hostUsername: isParticipant ? (hostUsernameMap[session.host_id] || "")            : undefined
    });
  }

  return results;
}
