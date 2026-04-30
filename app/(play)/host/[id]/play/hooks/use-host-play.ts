"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getGameSessionRT,
  getParticipantsRT,
  subscribeToGameRT,
  unsubscribeFromGameRT,
  GameSessionRT,
  GameParticipantRT,
  supabaseRealtime
} from "@/lib/supabase-realtime";
import { useGameCountdown } from "@/app/(play)/component/game-timer";

export function useHostPlay(sessionId: string) {
  const router = useRouter();

  const [session,            setSession]            = useState<GameSessionRT | null>(null);
  const [participants,       setParticipants]       = useState<Array<GameParticipantRT & { avatar_url?: string }>>([]);
  const [loading,            setLoading]            = useState(true);
  const [showLoader,         setShowLoader]         = useState(false);
  const [countdownStartedAt, setCountdownStartedAt] = useState<string | null>(null);

  const profileCache = useRef(new Map<string, string>());

  // Countdown hook
  const { countdownLeft, showCountdown } = useGameCountdown({
    countdownStartedAt,
    countdownDuration: 10,
    onCountdownFinished: () => { fetchSessionData(); }
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const fetchProfiles = async (userIds: string[]) => {
    const uncached = userIds.filter((id) => id && !profileCache.current.has(id));
    if (uncached.length === 0) return;

    const { data } = await supabase.from("profiles").select("id, avatar_url").in("id", uncached);
    data?.forEach((p) => { if (p.avatar_url) profileCache.current.set(p.id, p.avatar_url); });
  };

  const buildParticipantsWithAvatars = async (parts: GameParticipantRT[]) => {
    const ids = parts.map((p) => p.user_id).filter(Boolean) as string[];
    await fetchProfiles(ids);
    const mapped = parts.map((p) => ({
      ...p,
      avatar_url: p.user_id ? profileCache.current.get(p.user_id) : undefined
    }));
    mapped.sort((a, b) => (b.responses?.length || 0) - (a.responses?.length || 0));
    return mapped;
  };

  // ─── Fetch & Subscribe ─────────────────────────────────────────────────────

  const fetchSessionData = async () => {
    try {
      const sess = await getGameSessionRT(sessionId);
      if (!sess) { toast.error("Session not found"); router.push("/dashboard"); return; }

      setSession(sess);
      if (sess.countdown_started_at) setCountdownStartedAt(sess.countdown_started_at);

      const parts = await getParticipantsRT(sessionId);
      setParticipants(await buildParticipantsWithAvatars(parts));
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessionData();

    const channel = subscribeToGameRT(sessionId, {
      onSessionChange: (updated) => {
        setSession((prev) => (prev ? { ...prev, ...updated } : null));
        if (updated.countdown_started_at) setCountdownStartedAt(updated.countdown_started_at);
        if (updated.status === "finished") router.push(`/result/${sessionId}`);
      },
      onParticipantChange: async () => {
        const fresh = await getParticipantsRT(sessionId);
        if (!fresh) return;
        setParticipants(await buildParticipantsWithAvatars(fresh));
      }
    });

    if (session?.status === "finished") router.push(`/result/${sessionId}`);

    return () => { unsubscribeFromGameRT(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Poll for started_at if not yet available
  useEffect(() => {
    if (showCountdown || session?.started_at) return;

    const poll = setInterval(async () => {
      try {
        const sess = await getGameSessionRT(sessionId);
        if (sess?.started_at) {
          setSession((prev) => (prev ? { ...prev, ...sess } : null));
          clearInterval(poll);
        }
      } catch (e) { console.error("Polling error:", e); }
    }, 500);

    return () => clearInterval(poll);
  }, [showCountdown, session?.started_at, sessionId]);

  // Debounce loader
  useEffect(() => {
    const isLoading = loading || !session;
    let t: NodeJS.Timeout;
    if (isLoading && !showCountdown) {
      t = setTimeout(() => setShowLoader(true), 200);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(t);
  }, [loading, session, showCountdown]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleEndGame = async () => {
    try {
      if (!supabaseRealtime) throw new Error("Realtime client not initialized");
      const { error } = await supabaseRealtime.functions.invoke("submit-game", {
        body: { action: "end", sessionId }
      });
      if (error) throw error;
      toast.success("Session ended successfully");
    } catch (err: any) {
      toast.error("Failed to end session: " + err.message);
    }
  };

  const handleTimeUp = async () => {
    if (session?.status === "active") await handleEndGame();
  };

  const questionLimit = session
    ? session.question_limit === "all" ? 100 : parseInt(session.question_limit) || 0
    : 0;

  return {
    session,
    participants,
    loading: loading || !session,
    showLoader,
    showCountdown,
    countdownLeft,
    questionLimit,
    handleEndGame,
    handleTimeUp
  };
}
