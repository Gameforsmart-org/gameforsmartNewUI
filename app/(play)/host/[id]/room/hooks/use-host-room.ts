"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  supabaseRealtime,
  isRealtimeDbConfigured,
  subscribeToGameRT,
  unsubscribeFromGameRT,
  getParticipantsRT,
  getGameSessionRT,
  subscribeToCountdownBroadcast,
  sendCountdownSignal,
  unsubscribeFromCountdownBroadcast,
  addParticipantRT
} from "@/lib/supabase-realtime";
import { calculateServerTimeOffset } from "@/lib/server-time";
import { useAuth } from "@/contexts/auth-context";
import type { Participant } from "@/app/(play)/types";

export function useHostRoom(sessionId: string) {
  const router = useRouter();
  const { user, profileId } = useAuth();

  const [quizData,          setQuizData]          = useState<any>(null);
  const [gameSession,       setGameSession]        = useState<any>(null);
  const [participants,      setParticipants]       = useState<Participant[]>([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [participantToKick, setParticipantToKick] = useState<Participant | null>(null);
  const [kickDialogOpen,    setKickDialogOpen]    = useState(false);

  const profileCache        = useRef(new Map<string, any>());
  const countdownChannelRef = useRef<RealtimeChannel | null>(null);

  const isHostJoined = participants.some((p) => p.user_id === profileId);

  // ─── Server time init ──────────────────────────────────────────────────────
  useEffect(() => { calculateServerTimeOffset(); }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const fetchProfiles = async (userIds: string[]) => {
    const uncached = userIds.filter((id) => id && !profileCache.current.has(id));
    if (uncached.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, avatar_url, username")
      .in("id", uncached);
    data?.forEach((p) => profileCache.current.set(p.id, p));
  };

  const mapWithAvatars = (parts: any[]): Participant[] =>
    parts.map((p) => ({
      id:         p.id,
      nickname:   p.nickname,
      user_id:    p.user_id,
      avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
    }));

  const refreshParticipants = async () => {
    const parts = await getParticipantsRT(sessionId);
    if (!parts) return;
    const ids = parts.map((p) => p.user_id).filter((id): id is string => !!id);
    await fetchProfiles(ids);
    setParticipants(mapWithAvatars(parts));
  };

  // ─── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profileId) return;

    const init = async () => {
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select(`*, quizzes(id, title, description, image_url, questions, profiles(username, avatar_url))`)
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        toast.error("Session not found");
        router.push("/dashboard");
        return;
      }

      if (session.host_id !== profileId) {
        toast.error("You are not authorized to host this session.");
        router.push("/dashboard");
        return;
      }

      const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;

      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("nickname, avatar_url")
        .eq("id", session.host_id)
        .single();

      setGameSession(session);
      setQuizData({
        ...quiz,
        creator_name:   hostProfile?.nickname || "Unknown",
        creator_avatar: hostProfile?.avatar_url,
        question_count: session.question_limit
          ? parseInt(session.question_limit)
          : quiz?.questions?.length || 0
      });

      // Persist to localStorage for result page fallback
      localStorage.setItem(`game_host_${session.id}`, profileId);
      localStorage.setItem("current_game_session", session.id);
      localStorage.setItem("current_profile_id", profileId);
      localStorage.setItem("current_host_id", profileId);

      setIsLoading(false);
    };

    init();
  }, [sessionId, user, profileId, router]);

  // ─── RT subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !gameSession) return;
    if (!isRealtimeDbConfigured || !supabaseRealtime) return;

    // Sync RT session snapshot
    getGameSessionRT(sessionId).then((rt) => {
      if (rt) setGameSession((prev: any) => ({ ...prev, ...rt }));
    });

    // Initial participants from RT
    refreshParticipants();

    const channel = subscribeToGameRT(sessionId, {
      onParticipantChange: refreshParticipants,
      onSessionChange:     () => {}
    });

    return () => { unsubscribeFromGameRT(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sessionId]);

  // ─── Status redirects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gameSession?.status === "finished") router.push(`/result/${sessionId}`);
    if (gameSession?.status === "active")   router.push(`/host/${sessionId}/play`);
  }, [gameSession?.status, sessionId, router]);

  // ─── Countdown broadcast ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const channel = subscribeToCountdownBroadcast(sessionId, (payload) => {
      if (payload.startedAt) {
        router.push(isHostJoined ? `/player/${sessionId}/play` : `/host/${sessionId}/play`);
      }
    });
    countdownChannelRef.current = channel;
    return () => {
      unsubscribeFromCountdownBroadcast(channel);
      countdownChannelRef.current = null;
    };
  }, [sessionId, isHostJoined, router]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleJoinAsPlayer = async () => {
    if (!profileId || isHostJoined) return;
    try {
      setIsLoading(true);
      if (isRealtimeDbConfigured && supabaseRealtime) {
        await addParticipantRT({
          session_id: sessionId,
          user_id:    profileId,
          nickname:   quizData?.creator_name || "Host"
        });
        toast.success("Joined as player!");
      }
    } catch {
      toast.error("Failed to join game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameSession) return;
    if (participants.length === 0) {
      toast.error("Waiting for participants... Ask them to join!");
      return;
    }
    try {
      if (countdownChannelRef.current) {
        await sendCountdownSignal(countdownChannelRef.current, new Date().toISOString());
      }
      router.push(isHostJoined ? `/player/${sessionId}/play` : `/host/${sessionId}/play`);
      supabase.functions
        .invoke("start-game", { body: { sessionId } })
        .catch((err) => console.error("Edge Function error:", err));
    } catch {
      toast.error("Failed to start game");
    }
  };

  const handleKickPlayer = async () => {
    if (!participantToKick) return;
    try {
      if (isRealtimeDbConfigured && supabaseRealtime) {
        const { error } = await supabaseRealtime
          .from("game_participants_rt")
          .delete()
          .eq("id", participantToKick.id);
        if (error) throw error;
      }
      setKickDialogOpen(false);
      setParticipantToKick(null);
      toast.success(`${participantToKick.nickname} kicked.`);
    } catch {
      toast.error("Failed to kick player");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  const shareToWhatsApp = (joinLink: string) => {
    const msg = `🎯 *GameforSmart*\n*${quizData?.title}*\n\nAyo main quiz bareng! 🎮\n\n📌 PIN: *${gameSession?.game_pin}*\n👤 Host: ${quizData?.creator_name}\n\n${joinLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareToTelegram = (joinLink: string) => {
    const msg = `🎯 GameforSmart - ${quizData?.title}\n\nPIN: ${gameSession?.game_pin}\nHost: ${quizData?.creator_name}\n\n${joinLink}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const joinLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${gameSession?.game_pin}`
    : "";

  return {
    quizData, gameSession, participants, isLoading, isHostJoined,
    participantToKick, setParticipantToKick,
    kickDialogOpen, setKickDialogOpen,
    joinLink,
    handleJoinAsPlayer,
    handleStartGame,
    handleKickPlayer,
    copyToClipboard,
    shareToWhatsApp,
    shareToTelegram
  };
}
