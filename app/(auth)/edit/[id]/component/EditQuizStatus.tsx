"use client";

// ============================================================
// _components/EditQuizStatus.tsx  (Shadcn Admin style)
// Loading spinner and "quiz not found" full-page states
// ============================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function LoadingState({
  authLoading,
  savingProgress,
}: {
  authLoading: boolean;
  savingProgress: string;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {authLoading ? t("editQuiz.messages.loadingAuth") : t("editQuiz.messages.loadingQuiz")}
        </p>
        {savingProgress && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{savingProgress}</p>
        )}
      </div>
    </div>
  );
}

export function NotFoundState() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-zinc-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Quiz not found
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          The quiz you're looking for doesn't exist or you don't have access.
        </p>
        <Link href="/dashboard">
          <Button size="sm" className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
