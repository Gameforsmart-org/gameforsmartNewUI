"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatTimeAgo } from "@/lib/utils";
import { RoleBadge } from "./role-badge";
import rawCategories from "@/data/categories.json";
import type { QuizHistory } from "../types";

const categoryMap: Record<string, string> = Object.fromEntries(
  rawCategories.map((c) => [c.id, c.title])
);

interface HistoryCardItemProps {
  quiz: QuizHistory;
}

export function HistoryCardItem({ quiz }: HistoryCardItemProps) {
  const router = useRouter();

  const verticalLineClass = cn(
    "vertical-line",
    quiz.roles.includes("host") && quiz.roles.includes("player")
      ? "bg-gradient-to-b from-green-500 to-yellow-500"
      : quiz.roles.includes("host")
        ? "bg-green-500"
        : "bg-yellow-500"
  );

  return (
    <Card
      onClick={() => router.push(`/result/${quiz.id}`)}
      className="border-card group relative cursor-pointer overflow-hidden py-0 transition-all hover:shadow-md">
      <div className={verticalLineClass} />

      <CardContent className="flex flex-1 flex-col gap-3 px-5 py-4">
        {/* Top: roles + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {quiz.roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
          </div>
          <span className="text-[10px] font-medium text-zinc-400">
            {formatTimeAgo(quiz.ended_at)}
          </span>
        </div>

        {/* Title + tags */}
        <div className="space-y-2">
          <h3
            className="line-clamp-2 text-sm font-bold text-zinc-800 transition-colors group-hover:text-orange-600 dark:text-zinc-200"
            title={quiz.quiztitle}>
            {quiz.quiztitle}
          </h3>

          <div className="flex gap-1">
            {quiz.category && (
              <span
                title="Category"
                className="rounded-lg border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 uppercase dark:border-green-700 dark:bg-green-900/30 dark:text-green-500">
                {categoryMap[quiz.category] || quiz.category}
              </span>
            )}
            {quiz.language && (
              <span
                title="Language"
                className="rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-700 uppercase dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
                {quiz.language}
              </span>
            )}
          </div>
        </div>

        {/* Footer: app + host */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            <Gamepad2 size={13} className="text-orange-500" />
            <span className="max-w-[120px] truncate">{quiz.application}</span>
          </div>

          {quiz.roles.includes("player") && quiz.hostName && (
            <Link
              href={`/profile/${quiz.hostUsername}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              title={`Host: ${quiz.hostName}`}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] text-zinc-400 transition-colors hover:bg-orange-500/10 hover:text-orange-500 p-2">
              <User size={13} className="text-orange-500" />
              <span className="max-w-[80px] truncate underline decoration-dotted underline-offset-2">
                {quiz.hostName}
              </span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
