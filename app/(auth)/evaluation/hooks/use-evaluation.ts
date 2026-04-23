"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  getDateRange,
  getPreviousPeriodRange,
  fetchPeriodStats,
  buildTopQuizzes
} from "../services/evaluation.service";
import type { PeriodFilter, TrendData, QuizStat } from "../types";

export function useEvaluation() {
  const { profileId, user, loading } = useAuth();
  const router = useRouter();

  const [period,          setPeriod]          = useState<PeriodFilter>("this_month");
  const [loadingData,     setLoadingData]     = useState(true);
  const [totalGames,      setTotalGames]      = useState(0);
  const [avgScore,        setAvgScore]        = useState(0);
  const [uniqueQuizCount, setUniqueQuizCount] = useState(0);
  const [trendData,       setTrendData]       = useState<TrendData | null>(null);
  const [topQuizzes,      setTopQuizzes]      = useState<QuizStat[]>([]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/evaluation");
    }
  }, [user, loading, router]);

  // Fetch data on period or profileId change
  useEffect(() => {
    if (!user || !profileId) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);

        const { start, end } = getDateRange(period);
        const currentData    = await fetchPeriodStats(profileId, start, end);

        setTotalGames(currentData.totalGames);
        setAvgScore(currentData.avgScore);
        setUniqueQuizCount(currentData.uniqueQuizzes);

        // Trend vs previous period
        const previousRange = getPreviousPeriodRange(period);
        if (previousRange) {
          const previousData   = await fetchPeriodStats(profileId, previousRange.start, previousRange.end);
          const percentChange  =
            previousData.totalGames > 0
              ? Math.round(
                  ((currentData.totalGames - previousData.totalGames) / previousData.totalGames) * 100
                )
              : currentData.totalGames > 0
                ? 100
                : 0;

          setTrendData({ current: currentData.totalGames, previous: previousData.totalGames, percentChange });
        } else {
          setTrendData(null);
        }

        setTopQuizzes(buildTopQuizzes(currentData.sessionsData, profileId));
      } catch (error) {
        console.error("Error fetching evaluation data:", error);
        toast.error("Gagal memuat data evaluasi");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [profileId, period]);

  const handleQuizClick = (quizId: string) => {
    const { start, end } = getDateRange(period);
    router.push(
      `/evaluation/${quizId}?start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}`
    );
  };

  return {
    period,       setPeriod,
    loadingData,
    totalGames,   avgScore,   uniqueQuizCount,
    trendData,
    topQuizzes,
    handleQuizClick
  };
}
