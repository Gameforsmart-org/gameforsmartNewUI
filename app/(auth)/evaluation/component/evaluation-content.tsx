"use client";

import { StatCard } from "./stat-card";
import { TrendCard } from "./trend-card";
import { TopQuizzesTable } from "./top-quizzes-table";
import { TimeFilter } from "./time-filter";
import { useEvaluation } from "../hooks/use-evaluation";

export default function EvaluationContent() {
  const {
    period,       setPeriod,
    loadingData,
    totalGames,   avgScore,   uniqueQuizCount,
    trendData,
    topQuizzes,
    handleQuizClick
  } = useEvaluation();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Evaluation</h1>
        <TimeFilter period={period} setPeriod={setPeriod} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Play"       value={loadingData ? "..." : totalGames.toString()}      icon="play"   />
        <StatCard title="Avg. Score" value={loadingData ? "..." : avgScore.toString()}         icon="target" />
        <StatCard title="Quizzes"    value={loadingData ? "..." : uniqueQuizCount.toString()}  icon="help"   />
        <TrendCard trendData={trendData} loading={loadingData} />
      </div>

      {/* Top Quizzes Table */}
      <TopQuizzesTable
        quizzes={topQuizzes}
        loading={loadingData}
        onQuizClick={handleQuizClick}
      />
    </div>
  );
}
