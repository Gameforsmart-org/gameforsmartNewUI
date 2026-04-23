"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendData } from "../types";

interface TrendCardProps {
  trendData: TrendData | null;
  loading: boolean;
}

function getTrendColor(trendData: TrendData | null): string {
  if (!trendData) return "text-muted-foreground";
  if (trendData.percentChange > 0) return "text-green-500";
  if (trendData.percentChange < 0) return "text-red-500";
  return "text-muted-foreground";
}

function TrendIcon({ trendData }: { trendData: TrendData | null }) {
  if (!trendData || trendData.percentChange === 0)
    return <Minus className="h-4 w-4" />;
  if (trendData.percentChange > 0)
    return <TrendingUp className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

export function TrendCard({ trendData, loading }: TrendCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl border shadow-sm">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm uppercase">Trend</p>
          <div className={getTrendColor(trendData)}>
            <TrendIcon trendData={trendData} />
          </div>
        </div>

        {loading ? (
          <div className="text-3xl font-bold">...</div>
        ) : trendData ? (
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">
              {trendData.percentChange > 0 ? "+" : ""}
              {trendData.percentChange}%
            </div>
            <span className="text-muted-foreground text-sm">vs period</span>
          </div>
        ) : (
          <div className="text-3xl font-bold">-</div>
        )}
      </div>
    </div>
  );
}
