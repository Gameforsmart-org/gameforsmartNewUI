"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  supabaseRealtime, isRealtimeDbConfigured,
  subscribeToGameRT, unsubscribeFromGameRT,
  getParticipantsRT, getGameSessionRT,
  subscribeToCountdownBroadcast, unsubscribeFromCountdownBroadcast
} from "@/lib/supabase-realtime";
import { calculateServerTimeOffset } from "@/lib/server-time";

export function usePlayerRoom(sessionId: string) {
  const router = useRouter();

  const [participantId,   setParticipantId]   = useState<string | null>(null);
  const [gameSession,     setGameSession]     = useState<any>(null);
  const [quizData,        setQuizData]        = useState<any>(null);
  const [participants,    setParticipants]    = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);

  const lastStatusRef  = useRef<string>("");
  const profileCache   = useRef(new Map<string, any>());

  // ─── Init server time ──────────────────────────────────────────────────────
  useEffect(() => { calculateServerTimeOffset(); }, []);

  // ─── Resolve participant ID ────────────────────────────────────────────────
  useEffect(() => {
    const find = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) { toast.error("User ID not found"); router.push("/join"); return; }

      if (isRealtimeDbConfigured) {
        const parts = await getParticipantsRT(sessionId);
        const mine  = parts.find((p: any) => p.user_id === userId);
        if (mine) { setParticipantId(mine.id); return; }
      }

      const { data: session } = await supabase
        .from("game_sessions").select("participants").eq("id", sessionId).single();
      if (session) {
        const mine = (session.participants || []).find((p: any) => p.user_id === userId);
        if (mine) { setParticipantId(mine.id); return; }
      }

      toast.error("You are not in this game"); router.push("/join");
    };
    find();
  }, [sessionId]);

  // ─── Profile helper ────────────────────────────────────────────────────────
  const fetchProfiles = async (ids: string[]) => {
    const uncached = ids.filter((id) => id && !profileCache.current.has(id));
    if (uncached.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, avatar_url, username").in("id", uncached);
    data?.forEach((p) => profileCache.current.set(p.id, p));
  };

  const mapWithAvatars = (parts: any[]) =>
    parts.map((p) => ({
      ...p,
      avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
    }));

  // ─── Initial data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!participantId) return;

    const init = async () => {
      try {
        const { data: session, error } = await supabase
          .from("game_sessions")
          .select(`*, quizzes(id, title, description, questions)`)
          .eq("id", sessionId).single();

        if (error || !session) { toast.error("Session not found"); router.push("/dashboard"); return; }

        const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;
        setGameSession(session);
        setQuizData(quiz);
        lastStatusRef.current = session.status;
        setLoading(false);

        // Participants
        if (isRealtimeDbConfigured) {
          const parts = await getParticipantsRT(sessionId);
          const ids = parts.map((p) => p.user_id).filter(Boolean) as string[];
          await fetchProfiles(ids);
          setParticipants(mapWithAvatars(parts));
        } else {
          const cur = session.participants || [];
          await fetchProfiles(cur.map((p: any) => p.user_id).filter(Boolean));
          setParticipants(mapWithAvatars(cur));
        }
      } catch (err) {
        toast.error("Failed to load session"); setLoading(false);
      }
    };

    init();
  }, [sessionId, participantId]);

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    if (isRealtimeDbConfigured && supabaseRealtime) {
      const channel = subscribeToGameRT(sessionId, {
        onSessionChange: (updated) => {
          if (updated.status !== lastStatusRef.current) {
            lastStatusRef.current = updated.status;
            setGameSession((prev: any) => ({ ...prev, ...updated }));
            if (updated.status === "finished") router.push(`/result/${sessionId}`);
          }
          if (updated.countdown_started_at) {
            setGameSession((prev: any) => ({ ...prev, countdown_started_at: updated.countdown_started_at }));
          }
        },
        onParticipantChange: async ({ eventType, old: oldPart }) => {
          if (eventType === "DELETE" && oldPart?.id === participantId) {
            handleKick(); return;
          }
          const parts = await getParticipantsRT(sessionId);
          const ids = parts.map((p) => p.user_id).filter(Boolean) as string[];
          await fetchProfiles(ids);
          setParticipants(mapWithAvatars(parts));
        }
      });
      return () => { unsubscribeFromGameRT(channel); };
    } else {
      // Main DB fallback
      const channel = supabase
        .channel(`game_sessions:${sessionId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
          (payload: any) => {
            const s = payload.new;
            if (s.status !== lastStatusRef.current) {
              lastStatusRef.current = s.status;
              setGameSession(s);
              if (s.status === "finished") router.push(`/result/${sessionId}`);
            }
            const parts = s.participants || [];
            if (!parts.find((p: any) => p.id === participantId)) { handleKick(); return; }
            fetchProfiles(parts.map((p: any) => p.user_id).filter(Boolean)).then(() => {
              setParticipants(mapWithAvatars(parts));
            });
          })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [sessionId, participantId, loading]);

  // ─── Countdown broadcast subscription ─────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const channel = subscribeToCountdownBroadcast(sessionId, () => {
      router.push(`/player/${sessionId}/play`);
    });
    return () => { unsubscribeFromCountdownBroadcast(channel); };
  }, [sessionId, router]);

  // ─── Status fallback redirect ──────────────────────────────────────────────
  useEffect(() => {
    if (gameSession?.status === "active")   router.push(`/player/${sessionId}/play`);
    if (gameSession?.status === "finished") router.push(`/result/${sessionId}`);
  }, [gameSession?.status, sessionId, router]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleKick = () => { toast.error("You have been removed from the game."); router.push("/dashboard"); };

  const handleLeaveGame = async () => {
    if (!participantId) return;
    try {
      if (isRealtimeDbConfigured && supabaseRealtime) {
        await supabaseRealtime.from("game_participants_rt").delete().eq("id", participantId);
      }
      const { data: s } = await supabase.from("game_sessions").select("participants").eq("id", sessionId).single();
      if (s) {
        const newParts = (s.participants || []).filter((p: any) => p.id !== participantId);
        await supabase.from("game_sessions").update({ participants: newParts }).eq("id", sessionId);
      }
      toast.success("Left the game");
    } catch (e) { console.error(e); }
    finally { router.push("/dashboard"); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const joinLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${gameSession?.game_pin}`
    : "";

  return {
    participantId, gameSession, quizData, participants,
    loading, leaveDialogOpen, setLeaveDialogOpen, linkCopied,
    joinLink, handleKick, handleLeaveGame, copyToClipboard
  };
}
