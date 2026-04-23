"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  fetchQuizTitle,
  fetchQuizSessions
} from "../../services/evaluation.service";
import { ITEMS_PER_PAGE } from "../../constants/period-options";
import type { SessionData } from "../../types";

export function useQuizEvaluation(params: Promise<{ id: string }>) {
  const { id: quizId } = use(params);
  const searchParams   = useSearchParams();
  const startParam     = searchParams.get("start");
  const endParam       = searchParams.get("end");

  const { user, loading } = useAuth();
  const router            = useRouter();
  const { toast }         = useToast();

  const [loadingData,    setLoadingData]    = useState(true);
  const [quizTitle,      setQuizTitle]      = useState("");
  const [sessions,       setSessions]       = useState<SessionData[]>([]);
  const [userProfileId,  setUserProfileId]  = useState<string | null>(null);
  const [currentPage,    setCurrentPage]    = useState(1);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/evaluation/${quizId}`);
      return;
    }
    if (user) fetchUserProfile();
  }, [user, loading, router, quizId]);

  // Fetch sessions when profileId is resolved
  useEffect(() => {
    if (userProfileId && quizId) loadSessions();
  }, [userProfileId, quizId, startParam, endParam]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (error) { console.error("Error fetching profile:", error); return; }
    setUserProfileId(data?.id || null);
  };

  const loadSessions = async () => {
    if (!userProfileId || !quizId) return;

    try {
      setLoadingData(true);

      // Parse date range from URL params (default to this month)
      const now = new Date();
      const start = startParam
        ? new Date(startParam + "T00:00:00")
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endParam
        ? new Date(endParam + "T23:59:59")
        : new Date(now);

      // Fetch title + sessions in parallel
      const [title, sessionList] = await Promise.all([
        fetchQuizTitle(quizId),
        fetchQuizSessions(quizId, userProfileId, start, end)
      ]);

      setQuizTitle(title);
      setSessions(sessionList);
    } catch (error) {
      console.error("Error fetching quiz sessions:", error);
      toast({ title: "Error", description: "Gagal memuat data sesi", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  // Pagination
  const totalPages       = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Period label for UI
  const getPeriodLabel = (): string => {
    if (!startParam || !endParam) return "Bulan Ini";
    const fmt = (d: Date) => {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
    return `${fmt(new Date(startParam))} - ${fmt(new Date(endParam))}`;
  };

  const handleSessionClick = (sessionId: string) => router.push(`/result/${sessionId}`);

  return {
    quizId,
    loading,
    loadingData,
    quizTitle,
    sessions,
    paginatedSessions,
    currentPage, setCurrentPage,
    totalPages,
    getPeriodLabel,
    handleSessionClick
  };
}
