"use client";

// ============================================================
// _components/steps/PreviewStep.tsx  (Shadcn Admin style)
// Tab 3 – quiz summary + questions list read-only preview
// ============================================================

import { Upload, Eye, CheckCircle2, Globe, Lock, BookOpen, Hash, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import type { Quiz } from "../../types";

interface Category { value: string; label: string }
interface Language { value: string; label: string }

interface PreviewStepProps {
  quiz: Quiz;
  categories: Category[];
  languages: Language[];
}

export function PreviewStep({ quiz, categories, languages }: PreviewStepProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const { exportQuestionsToExcel } = await import("@/lib/excel-utils");
      await exportQuestionsToExcel({
        title: quiz.title || t("editQuiz.messages.exportedQuiz"),
        description: quiz.description || "",
        category: quiz.category || "general",
        language: quiz.language || "id",
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question_text: q.text,
          time_limit: q.timeLimit,
          image_url: q.image_url || null,
          answers: q.answers.map((a, index) => ({
            id: a.id,
            answer_text: a.text,
            is_correct: q.correct === a.id,
            color: a.color,
            order_index: index,
            image_url: a.image_url || null,
          })),
        })),
      });
      toast({
        title: t("common.success"),
        description: t("editQuiz.messages.questionsExported", { count: quiz.questions.length }),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("editQuiz.messages.failedExportQuestions"),
        variant: "destructive",
      });
    }
  };

  const completedCount = quiz.questions.filter(
    (q) => q.text.trim().length > 0 && q.answers.some((_, i) => q.correct === i.toString())
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Summary card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-start gap-4 p-5">
          {/* Cover */}
          {quiz.image_url ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
              <Image src={quiz.image_url} alt="Cover" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {quiz.title || <span className="text-zinc-400">Judul belum diisi</span>}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {quiz.description || "Deskripsi belum diisi"}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="gap-1 text-[11px] h-5">
                <Hash className="w-3 h-3" />
                {quiz.questions.length} soal
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px] h-5 capitalize">
                {categories.find((c) => c.value === quiz.category)?.label || quiz.category}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px] h-5">
                <Languages className="w-3 h-3" />
                {languages.find((l) => l.value === quiz.language)?.label || quiz.language}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[11px] h-5",
                  quiz.is_public
                    ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-zinc-200 text-zinc-500"
                )}
              >
                {quiz.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {quiz.is_public ? t("editQuiz.preview.public") : t("editQuiz.preview.private")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Completion bar */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Kelengkapan soal</span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
              {completedCount}/{quiz.questions.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completedCount === quiz.questions.length && quiz.questions.length > 0
                  ? "bg-emerald-500"
                  : "bg-zinc-400"
              )}
              style={{ width: `${quiz.questions.length > 0 ? (completedCount / quiz.questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Export action */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={quiz.questions.length === 0}
          className="gap-1.5 text-xs h-8"
        >
          <Upload className="w-3.5 h-3.5" />
          Export ke Excel
        </Button>
      </div>

      <Separator />

      {/* Questions preview list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Questions Preview
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">{quiz.questions.length} soal</Badge>
        </div>

        {quiz.questions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-12 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No questions to preview
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
              >
                {/* Question text */}
                <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {question.text || <span className="italic text-zinc-400">Pertanyaan kosong</span>}
                    </p>
                    {question.image_url && (
                      <div className="mt-2 w-16 h-12 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <Image src={question.image_url} alt="Question" width={64} height={48} className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answers */}
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {question.answers.map((answer, aIndex) => {
                    const isCorrect = question.correct === answer.id;
                    return (
                      <div
                        key={answer.id}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs",
                          isCorrect
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                            : "bg-zinc-50 text-zinc-600 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: answer.color }}
                        >
                          {String.fromCharCode(65 + aIndex)}
                        </div>
                        {answer.image_url && (
                          <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                            <Image src={answer.image_url} alt="Answer" width={20} height={20} className="object-cover" />
                          </div>
                        )}
                        <span className="flex-1 truncate">{answer.text}</span>
                        {isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
