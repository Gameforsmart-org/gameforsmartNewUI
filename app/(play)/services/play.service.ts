import { supabase } from "@/lib/supabase";
import {
  addParticipantRT,
  isRealtimeDbConfigured,
  getParticipantsRT,
  supabaseRealtime
} from "@/lib/supabase-realtime";
import { generateXID } from "@/lib/id-generator";
import { createNotification } from "@/app/service/notification";
import type { Friend, Group } from "../types";

// ─────────────────────────────────────────────
// Join
// ─────────────────────────────────────────────

export async function resolveProfile(userId: string, profileIdCtx?: string | null) {
  if (profileIdCtx) {
    const { data } = await supabase
      .from("profiles")
      .select("username, nickname, fullname")
      .eq("id", profileIdCtx)
      .single();
    return { profileId: profileIdCtx, username: data?.nickname || data?.fullname || data?.username || "" };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, username, nickname, fullname")
    .eq("auth_user_id", userId)
    .single();

  if (!data) throw new Error("Profile not found");
  return {
    profileId: data.id,
    username: data.nickname || data.fullname || data.username || ""
  };
}

export async function findGameSession(gamePin: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("id, status, participants, allow_join_after_start")
    .eq("game_pin", gamePin)
    .single();

  if (error || !data) throw new Error("PIN not valid");
  return data;
}

export async function joinSession(sessionId: string, profileId: string, nickname: string) {
  const newParticipant = {
    id: generateXID(),
    user_id: profileId,
    nickname,
    score: 0,
    started: new Date().toISOString(),
    ended: null
  };

  if (isRealtimeDbConfigured) {
    await addParticipantRT({
      id: newParticipant.id,
      session_id: sessionId,
      user_id: profileId,
      nickname
    });
  } else {
    const { data: session } = await supabase
      .from("game_sessions")
      .select("participants")
      .eq("id", sessionId)
      .single();

    const current = session?.participants || [];
    const { error } = await supabase
      .from("game_sessions")
      .update({ participants: [...current, newParticipant] })
      .eq("id", sessionId);

    if (error) throw new Error("Failed to join session: " + error.message);
  }

  return newParticipant.id;
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export async function fetchSessionWithQuiz(sessionId: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select(`*, quizzes!inner(id, title, questions)`)
    .eq("id", sessionId)
    .single();

  if (error || !data) throw new Error("Session tidak ditemukan");
  return data;
}

export async function updateSessionSettings(
  sessionId: string,
  updates: {
    total_time_minutes: number;
    game_end_mode: string;
    allow_join_after_start: boolean;
    question_limit: string;
  }
) {
  const { error } = await supabase.from("game_sessions").update(updates).eq("id", sessionId);
  if (error) throw error;

  // Sync Realtime DB
  if (supabaseRealtime) {
    await supabaseRealtime.from("game_sessions_rt").update(updates).eq("id", sessionId);
  }
}

export async function selectQuestionsForSession(quizId: string, sessionId: string, questionLimit: string) {
  const { data, error } = await supabase.rpc("select_questions_for_session", {
    p_quiz_id: quizId,
    p_session_id: sessionId,
    p_question_limit: questionLimit
  });
  if (error) throw new Error("Gagal memilih soal: " + error.message);

  const { error: updateError } = await supabase
    .from("game_sessions")
    .update({ current_questions: data || [] })
    .eq("id", sessionId);

  if (updateError) throw updateError;

  if (isRealtimeDbConfigured && supabaseRealtime) {
    await supabaseRealtime
      .from("game_sessions_rt")
      .update({ current_questions: data || [] })
      .eq("id", sessionId);
  }

  return data;
}

export async function deleteSession(sessionId: string) {
  await supabase.from("game_sessions").delete().eq("id", sessionId);
  if (supabaseRealtime) {
    await supabaseRealtime.from("game_sessions_rt").delete().eq("id", sessionId);
  }
}

// ─────────────────────────────────────────────
// Waiting Room (host)
// ─────────────────────────────────────────────

export async function fetchSessionAndQuiz(sessionId: string) {
  const { data: session, error } = await supabase
    .from("game_sessions")
    .select(`*, quizzes(id, title, description, image_url, questions, profiles(username, avatar_url))`)
    .eq("id", sessionId)
    .single();

  if (error || !session) throw new Error("Session not found");

  const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;

  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", session.host_id)
    .single();

  return {
    session,
    quiz: {
      ...quiz,
      creator_name: hostProfile?.nickname || "Unknown",
      creator_avatar: hostProfile?.avatar_url,
      question_count: session.question_limit
        ? parseInt(session.question_limit)
        : quiz?.questions?.length || 0
    }
  };
}

export async function kickParticipant(participantId: string) {
  if (!isRealtimeDbConfigured || !supabaseRealtime) return;
  const { error } = await supabaseRealtime
    .from("game_participants_rt")
    .delete()
    .eq("id", participantId);
  if (error) throw error;
}

export async function fetchProfilesBatch(ids: string[]) {
  const uncached = ids.filter(Boolean);
  if (uncached.length === 0) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, avatar_url, username")
    .in("id", uncached);
  return data || [];
}

// ─────────────────────────────────────────────
// Invite Friends / Groups
// ─────────────────────────────────────────────

export async function fetchMutualFriends(profileId: string): Promise<Friend[]> {
  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase.from("friendships").select("addressee_id").eq("requester_id", profileId),
    supabase.from("friendships").select("requester_id").eq("addressee_id", profileId)
  ]);

  const followingIds = following?.map((f) => f.addressee_id) || [];
  const followerIds  = followers?.map((f) => f.requester_id) || [];
  const mutualIds    = followingIds.filter((id) => followerIds.includes(id));

  if (mutualIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, nickname, fullname, avatar_url")
    .in("id", mutualIds);

  return (profiles || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    fullname: p.fullname || p.nickname || p.username,
    avatar_url: p.avatar_url
  }));
}

export async function fetchMyGroups(profileId: string): Promise<Group[]> {
  const { data, error } = await supabase.from("groups").select("id, name, members");
  if (error) throw error;

  return (data || [])
    .filter((g: any) => {
      const members = Array.isArray(g.members) ? g.members : [];
      const member = members.find((m: any) => m.user_id === profileId || m.id === profileId);
      return member && (member.role === "owner" || member.role === "admin");
    })
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      members: g.members,
      member_count: Array.isArray(g.members) ? g.members.length : 0
    }));
}

export async function sendFriendInvite(sessionId: string, profileId: string, friend: Friend) {
  await createNotification([{
    user_id: friend.id,
    actor_id: profileId,
    type: "sessionFriend",
    entity_type: "session",
    entity_id: sessionId,
    status: null,
    content: null,
    is_read: false,
    created_at: new Date().toISOString()
  }]);
}

export async function sendGroupInvite(sessionId: string, profileId: string, group: Group) {
  const members = Array.isArray(group.members) ? group.members : [];
  const notifications = members
    .map((m: any) => m.user_id || m.id)
    .filter((mId: string) => mId && mId !== profileId)
    .map((mId: string) => ({
      user_id: mId,
      actor_id: profileId,
      type: "sessionGroup",
      entity_type: "session",
      entity_id: sessionId,
      from_group_id: group.id,
      status: null,
      content: null,
      is_read: false,
      created_at: new Date().toISOString()
    }));

  if (notifications.length === 0) throw new Error("no_members");
  await createNotification(notifications);
  return notifications.length;
}
