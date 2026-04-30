"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getGameSessionRT, subscribeToGameRT, unsubscribeFromGameRT,
  updateParticipantResponseRT, updateParticipantStartRT,
  getParticipantsRT, isRealtimeDbConfigured, GameSessionRT, supabaseRealtime
} from "@/lib/supabase-realtime";
import { useGameTimer, useGameCountdown } from "@/app/(play)/component/game-timer";
import { getServerNow } from "@/lib/server-time";

interface Question {
  id: string;
  question: string;
  type?: string;
  image?: string | null;
  answers?: { id: string; answer: string; image: string | null }[];
  options?: { id: string; text: string; key: string }[];
  [key: string]: any;
}

export function usePlayerPlay(sessionId: string) {
  const router = useRouter();

  const [participantId,     setParticipantId]     = useState<string | null>(null);
  const [session,           setSession]           = useState<GameSessionRT | null>(null);
  const [questions,         setQuestions]         = useState<Question[]>([]);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [loading,           setLoading]           = useState(true);
  const [responses,         setResponses]         = useState<Record<string, string>>({});
  const [flagged,           setFlagged]           = useState<Set<string>>(new Set());
  const [submitDialogOpen,  setSubmitDialogOpen]  = useState(false);
  const [hasAutoSubmitted,  setHasAutoSubmitted]  = useState(false);
  const [showLoader,        setShowLoader]        = useState(false);
  const [isStateRestored,   setIsStateRestored]   = useState(false);
  const [countdownStartedAt, setCountdownStartedAt] = useState<string | null>(null);

  // ─── Countdown hook ────────────────────────────────────────────────────────
  const { countdownLeft, showCountdown } = useGameCountdown({
    countdownStartedAt,
    countdownDuration: 10,
    onCountdownFinished: async () => {
      try {
        const sess = await getGameSessionRT(sessionId);
        if (sess) {
          setSession(sess);
          if (sess.countdown_started_at) setCountdownStartedAt(sess.countdown_started_at);
        }
      } catch (e) { console.error("Failed to refresh session after countdown", e); }
    }
  });

  // ─── Timer hook ────────────────────────────────────────────────────────────
  const { timeLeft } = useGameTimer({
    startedAt:       session?.started_at ?? null,
    totalTimeMinutes: session?.total_time_minutes ?? 0,
    status:          session?.status ?? "waiting",
    onTimeUp: () => { toast.info("Time is up!"); }
  });

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

      const { data: session } = await supabase.from("game_sessions").select("participants").eq("id", sessionId).single();
      if (session) {
        const mine = (session.participants || []).find((p: any) => p.user_id === userId);
        if (mine) { setParticipantId(mine.id); return; }
      }

      toast.error("You are not in this game"); router.push("/join");
    };
    find();
  }, [sessionId]);

  // ─── Poll for started_at ───────────────────────────────────────────────────
  useEffect(() => {
    if (showCountdown || session?.started_at) return;
    const poll = setInterval(async () => {
      try {
        const sess = await getGameSessionRT(sessionId);
        if (sess?.started_at) { setSession((prev) => (prev ? { ...prev, ...sess } : null)); clearInterval(poll); }
      } catch (e) { console.error("Polling error:", e); }
    }, 500);
    return () => clearInterval(poll);
  }, [showCountdown, session?.started_at, sessionId]);

  // ─── Main init + subscribe ─────────────────────────────────────────────────
  useEffect(() => {
    if (!participantId) return;

    const init = async () => {
      // 1. Load questions
      let loaded: Question[] = [];

      const stored = localStorage.getItem(`player_game_data_${sessionId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) loaded = parsed.questions;
        } catch {}
      }

      if (loaded.length === 0 && isRealtimeDbConfigured && supabaseRealtime) {
        try {
          const { data: sd } = await supabase.from("game_sessions").select("current_questions").eq("id", sessionId).single();
          const base = sd?.current_questions || [];
          if (base.length > 0) {
            const { data: shuffled, error } = await supabaseRealtime.rpc("shuffle_questions_for_player", {
              p_questions: base, p_participant_id: participantId
            });
            if (!error && shuffled) {
              loaded = shuffled.map(({ correct, ...rest }: any) => rest);
              localStorage.setItem(`player_game_data_${sessionId}`, JSON.stringify({ questions: loaded }));
            }
          }
        } catch {}
      }

      if (loaded.length === 0) {
        for (let i = 0; i < 3 && loaded.length === 0; i++) {
          try {
            const { data: sd } = await supabase.from("game_sessions").select("current_questions").eq("id", sessionId).single();
            if (sd && sd.current_questions?.length > 0) {
              loaded = sd.current_questions;
              localStorage.setItem(`player_game_data_${sessionId}`, JSON.stringify({ questions: loaded }));
              break;
            }
          } catch {}
          if (i < 2) await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (loaded.length > 0) {
        setQuestions(loaded);
      } else {
        toast.error("Could not load questions. Please refresh.");
      }

      // 2. Restore saved state
      try {
        const saved = localStorage.getItem(`player_game_state_${sessionId}_${participantId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.responses) setResponses(parsed.responses);
          if (Array.isArray(parsed.flagged)) setFlagged(new Set(parsed.flagged));
        }
      } catch {}
      setIsStateRestored(true);

      // 3. Load session
      let sess = await getGameSessionRT(sessionId);
      if (!sess) {
        const { data: main } = await supabase.from("game_sessions").select("*").eq("id", sessionId).single();
        if (main) sess = main as any;
      }

      if (sess) {
        setSession(sess);
        if (sess.countdown_started_at) setCountdownStartedAt(sess.countdown_started_at);
        if (sess.status === "finished") router.push(`/result/${sessionId}`);
      } else {
        toast.error("Session not found");
      }

      setLoading(false);
      await updateParticipantStartRT(participantId);
    };

    init();

    const channel = subscribeToGameRT(sessionId, {
      onSessionChange: (updated) => {
        setSession((prev) => (prev ? { ...prev, ...updated } : null));
        if (updated.countdown_started_at) setCountdownStartedAt(updated.countdown_started_at);
        if (updated.status === "finished") router.push(`/result/${sessionId}`);
      }
    });

    return () => { unsubscribeFromGameRT(channel); };
  }, [sessionId, participantId]);

  // ─── Persist state ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStateRestored || !participantId) return;
    localStorage.setItem(
      `player_game_state_${sessionId}_${participantId}`,
      JSON.stringify({ responses, flagged: Array.from(flagged) })
    );
  }, [responses, flagged, isStateRestored, sessionId, participantId]);

  // ─── Debounce loader ───────────────────────────────────────────────────────
  useEffect(() => {
    const isLoad = loading || !session;
    let t: NodeJS.Timeout;
    if (isLoad && !showCountdown) { t = setTimeout(() => setShowLoader(true), 200); }
    else { setShowLoader(false); }
    return () => clearTimeout(t);
  }, [loading, session, showCountdown]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount  = Object.keys(responses).length;
  const allAnswered    = questions.length > 0 && answeredCount === questions.length;
  const progressPct    = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (isLastQuestion) {
      if (allAnswered) setSubmitDialogOpen(true);
      else setCurrentIndex(0);
    } else {
      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
    }
  };

  const handlePrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleJumpTo   = (i: number) => setCurrentIndex(i);

  const handleFlag = () => {
    const qId = currentQuestion.id;
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  // ─── Answer ────────────────────────────────────────────────────────────────
  const handleAnswer = async (answerId: string) => {
    if (!participantId || !currentQuestion) return;
    const qId = currentQuestion.id;

    setResponses((prev) => ({ ...prev, [qId]: answerId }));
    updateParticipantResponseRT(sessionId, participantId, qId, answerId);

    const updated = { ...responses, [qId]: answerId };
    if (Object.keys(updated).length === questions.length) {
      if (!hasAutoSubmitted) { setSubmitDialogOpen(true); setHasAutoSubmitted(true); }
    } else {
      // Jump to next unanswered
      let next = -1;
      for (let i = currentIndex + 1; i < questions.length; i++) {
        if (!updated[questions[i].id]) { next = i; break; }
      }
      if (next === -1) {
        for (let i = 0; i < currentIndex; i++) {
          if (!updated[questions[i].id]) { next = i; break; }
        }
      }
      if (next !== -1) setCurrentIndex(next);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (!supabaseRealtime) throw new Error("Realtime client not initialized");
      setLoading(true);
      const { error } = await supabaseRealtime.functions.invoke("submit-game", {
        body: { action: "submit", sessionId, participantId }
      });
      if (error) throw error;
      router.push(`/result/${sessionId}`);
    } catch (err: any) {
      toast.error("Failed to submit: " + err.message);
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    session, questions, currentQuestion, currentIndex,
    loading: loading || !session, showLoader, showCountdown,
    countdownLeft, timeLeft, formatTime,
    responses, flagged, submitDialogOpen, setSubmitDialogOpen,
    answeredCount, allAnswered, progressPct, isLastQuestion,
    handleNext, handlePrevious, handleJumpTo, handleFlag, handleAnswer, handleSubmit
  };
}