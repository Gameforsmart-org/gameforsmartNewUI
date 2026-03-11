"use client";

// ============================================================
// _components/EditQuizLayout.tsx
// Shadcn Admin Dashboard style – Tabs-based layout.
// Receives the full useEditQuiz() return value as `editQuiz`
// prop so the hook is only called once (in EditQuizContent).
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Info, Brain, Eye,
  Save, ChevronRight, AlertCircle, Globe, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

import { InfoStep } from "./steps/InfoStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";
import {
  SaveConfirmDialog,
  DeleteQuestionDialog,
  DeleteAnswerDialog,
  SavingOverlay,
} from "./EditQuizDialogs";
import type { useEditQuiz } from "../hooks/useEditQuiz";

type EditQuizState = ReturnType<typeof useEditQuiz>;

// ── Tab definition ──────────────────────────────────────────
type TabId = "info" | "questions" | "preview";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  { id: "info",      label: "Informasi",  icon: Info,  description: "Detail dasar quiz" },
  { id: "questions", label: "Pertanyaan", icon: Brain, description: "Edit soal & jawaban" },
  { id: "preview",   label: "Preview",    icon: Eye,   description: "Tinjau & simpan" },
];

interface EditQuizLayoutProps {
  editQuiz: EditQuizState;
}

export function EditQuizLayout({ editQuiz: q }: EditQuizLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("info");

  // quiz is guaranteed non-null by the parent guard
  const quiz = q.quiz!;

  // ── Tab helpers ─────────────────────────────────────────
  const isTabComplete = (tabId: TabId): boolean => {
    if (tabId === "info") {
      return quiz.title.trim().length > 0 && (quiz.description?.trim().length || 0) > 0;
    }
    if (tabId === "questions") {
      return (
        quiz.questions.length > 0 &&
        quiz.questions.some(
          (qn: any) => qn.text.trim().length > 0 && qn.answers.some((_: any, i: number) => qn.correct === i.toString())
        )
      );
    }
    return false;
  };

  const getTabBadge = (tabId: TabId): string | null =>
    tabId === "questions" && quiz.questions.length > 0
      ? String(quiz.questions.length)
      : null;

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <InfoStep
            quiz={quiz}
            categories={q.categories}
            languages={q.languages}
            onUpdate={q.updateQuiz}
          />
        );
      case "questions":
        return (
          <QuestionsStep
            quiz={quiz}
            selectedQuestionIndex={q.selectedQuestionIndex}
            onSelectQuestion={q.setSelectedQuestionIndex}
            onAddQuestion={q.addQuestion}
            onRemoveQuestion={q.removeQuestion}
            onUpdateQuestion={q.updateQuestion}
            onUpdateAnswer={q.updateAnswer}
            onSetCorrectAnswer={q.setCorrectAnswer}
          />
        );
      case "preview":
        return (
          <PreviewStep
            quiz={quiz}
            categories={q.categories}
            languages={q.languages}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* ── Top Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-14 items-center gap-4 px-6">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {/* Quiz identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            {quiz.image_url ? (
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={quiz.image_url}
                  alt={quiz.title}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
              </div>
            )}
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-48">
              {quiz.title || "Edit Quiz"}
            </h1>
          </div>

          {/* Visibility badge */}
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs font-medium hidden sm:flex",
              quiz.is_public
                ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                : "border-zinc-200 text-zinc-500"
            )}
          >
            {quiz.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {quiz.is_public ? "Publik" : "Privat"}
          </Badge>

          <div className="flex-1" />

          {/* Save button */}
          <Button
            size="sm"
            onClick={q.handleSaveClick}
            disabled={q.saving || !quiz.title?.trim()}
            className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-sm"
          >
            {q.saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-6">
          <nav className="flex gap-0" role="tablist">
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isComplete = isTabComplete(tab.id);
              const badge = getTabBadge(tab.id);

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px focus-visible:outline-none",
                    isActive
                      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {/* Step number / complete check */}
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {isComplete && !isActive ? "✓" : index + 1}
                  </span>

                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>

                  {badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold leading-none">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main + Sidebar ──────────────────────────────────── */}
      <div className="flex">
        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Tab heading row */}
                {(() => {
                  const tab = TABS.find((tb) => tb.id === activeTab)!;
                  const Icon = tab.icon;
                  return (
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {tab.label}
                          </h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      {activeTab !== "preview" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isTabComplete(activeTab)}
                          onClick={() => {
                            const order: TabId[] = ["info", "questions", "preview"];
                            const next = order[order.indexOf(activeTab) + 1];
                            if (next) setActiveTab(next);
                          }}
                          className="gap-1.5 text-xs"
                        >
                          Lanjutkan
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })()}

                <Separator className="mb-6" />

                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="hidden xl:block w-64 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-h-[calc(100vh-7rem)] sticky top-[7rem] self-start">
          <div className="p-5 space-y-5">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Progress
            </p>

            {/* Tab checklist */}
            <div className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isComplete = isTabComplete(tab.id);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors text-sm",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                      )}
                    >
                      {isComplete ? "✓" : ""}
                    </span>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className={cn("font-medium", isActive && "font-semibold")}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* Quiz summary */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ringkasan
              </p>
              <SidebarRow label="Judul"       value={quiz.title || "—"} truncate />
              <SidebarRow label="Kategori"    value={quiz.category || "—"} />
              <SidebarRow label="Bahasa"      value={quiz.language === "id" ? "Indonesia" : "English"} />
              <SidebarRow
                label="Jumlah Soal"
                value={quiz.questions.length > 0 ? `${quiz.questions.length} soal` : "—"}
                highlight={quiz.questions.length > 0}
              />
              <SidebarRow label="Visibilitas" value={quiz.is_public ? "Publik" : "Privat"} />
            </div>

            {/* Unsaved hint */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Klik Simpan Perubahan untuk menyimpan semua perubahan.
              </p>
            </div>

            <Button
              className="w-full gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-sm"
              size="sm"
              onClick={q.handleSaveClick}
              disabled={q.saving || !quiz.title?.trim()}
            >
              {q.saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────── */}
      <SaveConfirmDialog
        open={q.showSaveConfirm}
        quiz={quiz}
        categories={q.categories}
        languages={q.languages}
        onOpenChange={q.setShowSaveConfirm}
        onConfirm={q.saveQuiz}
      />
      <DeleteQuestionDialog
        open={q.showDeleteQuestionConfirm}
        skipConfirmation={q.skipQuestionDeleteConfirmation}
        onOpenChange={q.setShowDeleteQuestionConfirm}
        onSkipChange={q.setSkipQuestionDeleteConfirmation}
        onConfirm={q.confirmDeleteQuestion}
      />
      <DeleteAnswerDialog
        open={q.showDeleteAnswerConfirm}
        skipConfirmation={q.skipAnswerDeleteConfirmation}
        onOpenChange={q.setShowDeleteAnswerConfirm}
        onSkipChange={q.setSkipAnswerDeleteConfirmation}
        onConfirm={q.confirmDeleteAnswer}
      />
      <SavingOverlay saving={q.saving} savingProgress={q.savingProgress} />
    </div>
  );
}

// ── Sidebar helper ───────────────────────────────────────────
function SidebarRow({
  label,
  value,
  truncate = false,
  highlight = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{label}</span>
      <span
        className={cn(
          "text-xs font-medium text-right",
          truncate && "truncate max-w-[120px]",
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-700 dark:text-zinc-300"
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
