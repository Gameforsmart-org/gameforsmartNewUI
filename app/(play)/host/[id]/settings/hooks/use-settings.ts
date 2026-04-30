"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchSessionWithQuiz,
  updateSessionSettings,
  selectQuestionsForSession,
  deleteSession
} from "../../../../services/play.service";
import {
  addParticipantRT,
  isRealtimeDbConfigured,
  supabaseRealtime
} from "@/lib/supabase-realtime";
import { supabase } from "@/lib/supabase";

export function useSettings(params: Promise<{ id: string }>) {
  const { id: sessionId } = use(params);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { profileId, profile } = useAuth();

  const mode     = searchParams.get("mode");
  const isTryout = mode === "tryout";
  const from     = searchParams.get("from");

  const [isLoading,           setIsLoading]           = useState(true);
  const [isSaving,            setIsSaving]            = useState(false);
  const [showExitDialog,      setShowExitDialog]      = useState(false);
  const [quizData,            setQuizData]            = useState<any>(null);
  const [gameSession,         setGameSession]         = useState<any>(null);
  const [totalTimeMinutes,    setTotalTimeMinutes]    = useState("5");
  const [gameEndMode,         setGameEndMode]         = useState("first_finish");
  const [allowJoinAfterStart, setAllowJoinAfterStart] = useState(false);
  const [questionLimit,       setQuestionLimit]       = useState("5");

  const loadSession = useCallback(async () => {
    try {
      const data = await fetchSessionWithQuiz(sessionId);
      setGameSession(data);
      setQuizData(data.quizzes);
      setTotalTimeMinutes(data.total_time_minutes?.toString() || "5");
      setGameEndMode(data.game_end_mode || "first_finish");
      setAllowJoinAfterStart(data.allow_join_after_start || false);

      const totalQ = data.quizzes.questions?.length || 0;
      const limit  = data.question_limit || "5";
      setQuestionLimit(parseInt(limit) <= totalQ ? limit : totalQ.toString());
      setIsLoading(false);
    } catch {
      toast.error("Gagal memuat data");
      router.push("/dashboard");
    }
  }, [sessionId, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const handleCancel = async () => {
    if (from === "room") { setShowExitDialog(true); return; }
    try {
      await deleteSession(sessionId);
      toast.success("Session cancelled");
    } catch {}
    finally { router.push("/dashboard"); }
  };

  const handleLeaveSession = async () => {
    try {
      await deleteSession(sessionId);
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    } finally {
      router.push("/dashboard");
    }
  };

  const handleSave = async () => {
    if (!quizData || !gameSession) return;
    setIsSaving(true);
    try {
      await updateSessionSettings(sessionId, {
        total_time_minutes:    parseInt(totalTimeMinutes),
        game_end_mode:         gameEndMode,
        allow_join_after_start: allowJoinAfterStart,
        question_limit:        questionLimit
      });

      await selectQuestionsForSession(quizData.id, sessionId, questionLimit);

      toast.success("Pengaturan disimpan");

      if (isTryout) {
        if (profileId && isRealtimeDbConfigured && supabaseRealtime) {
          await addParticipantRT({
            session_id: sessionId,
            user_id: profileId,
            nickname: profile?.nickname || profile?.fullname || profile?.username || "Tryout Player"
          });
        }
        supabase.functions.invoke("start-game", { body: { sessionId } }).catch(console.error);
        router.push(`/player/${sessionId}/play`);
      } else {
        router.push(`/host/${sessionId}/room`);
      }
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    sessionId, isTryout, isLoading, isSaving,
    showExitDialog, setShowExitDialog,
    quizData, gameSession,
    totalTimeMinutes, setTotalTimeMinutes,
    gameEndMode, setGameEndMode,
    allowJoinAfterStart, setAllowJoinAfterStart,
    questionLimit, setQuestionLimit,
    handleCancel, handleLeaveSession, handleSave
  };
}
