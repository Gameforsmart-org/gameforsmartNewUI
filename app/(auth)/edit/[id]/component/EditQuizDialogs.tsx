"use client";

// ============================================================
// _components/EditQuizDialogs.tsx  (Shadcn Admin style)
// SaveConfirm, DeleteQuestion, DeleteAnswer, SavingOverlay
// ============================================================

import { motion } from "framer-motion";
import { AlertTriangle, Info, Save, Globe, Lock, XCircle, ShieldCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import type { Quiz } from "../types";

// ── Save Confirmation ────────────────────────────────────────

interface SaveConfirmDialogProps {
  open: boolean;
  quiz: Quiz | null;
  categories: { value: string; label: string }[];
  languages: { value: string; label: string }[];
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function SaveConfirmDialog({
  open, quiz, categories, languages, onOpenChange, onConfirm,
}: SaveConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            Confirm Save Quiz
          </DialogTitle>
          <DialogDescription className="text-xs">
            Make sure the quiz information is correct before saving.
          </DialogDescription>
        </DialogHeader>

        {quiz && (
          <div className="space-y-4 mt-2">
            {/* Summary */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Quiz Summary
              </p>
              <div className="space-y-1.5 text-xs">
                <SummaryRow label="Title:">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]" title={quiz.title}>
                    {quiz.title || t("editQuiz.preview.notSet")}
                  </span>
                </SummaryRow>
                <SummaryRow label="Description:">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]" title={quiz.description || ""}>
                    {quiz.description || t("editQuiz.confirmSave.noDescription")}
                  </span>
                </SummaryRow>
                <SummaryRow label="Questions:">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {quiz.questions.length} questions
                  </span>
                </SummaryRow>
                <SummaryRow label="Category:">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {categories.find((c) => c.value === quiz.category)?.label || "General"}
                  </span>
                </SummaryRow>
                <SummaryRow label="Language:">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {languages.find((l) => l.value === quiz.language)?.label || "English"}
                  </span>
                </SummaryRow>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 text-[11px]",
                      quiz.is_public
                        ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                        : "border-zinc-200 text-zinc-500"
                    )}
                  >
                    {quiz.is_public ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    {quiz.is_public ? t("editQuiz.preview.public") : t("editQuiz.preview.private")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Validation warning */}
            {(quiz.questions.length === 0 || !quiz.title.trim()) && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 dark:text-red-400">
                  <p className="font-semibold mb-1">Warning:</p>
                  {!quiz.title.trim() && <p>Title is required.</p>}
                  {quiz.questions.length === 0 && <p>No questions added yet.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Question ──────────────────────────────────────────

interface DeleteQuestionDialogProps {
  open: boolean;
  skipConfirmation: boolean;
  onOpenChange: (v: boolean) => void;
  onSkipChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function DeleteQuestionDialog({
  open, skipConfirmation, onOpenChange, onSkipChange, onConfirm,
}: DeleteQuestionDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            Delete Answer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Are you sure you want to delete this answer?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 mt-2">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
            Don't ask again
          </Label>
          <Switch
            checked={skipConfirmation}
            onCheckedChange={onSkipChange}
            className="scale-90"
          />
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Answer ────────────────────────────────────────────

interface DeleteAnswerDialogProps {
  open: boolean;
  skipConfirmation: boolean;
  onOpenChange: (v: boolean) => void;
  onSkipChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function DeleteAnswerDialog({
  open, skipConfirmation, onOpenChange, onSkipChange, onConfirm,
}: DeleteAnswerDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            Delete Answer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Are you sure you want to delete this answer?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 mt-2">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
            Don't ask again
          </Label>
          <Switch
            checked={skipConfirmation}
            onCheckedChange={onSkipChange}
            className="scale-90"
          />
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button> 
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Saving Overlay ───────────────────────────────────────────

export function SavingOverlay({
  saving,
  savingProgress,
}: {
  saving: boolean;
  savingProgress: string;
}) {
  if (!saving) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-zinc-200 dark:border-zinc-800"
      >
        <div className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
          <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
          Menyimpan perubahan...
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          {savingProgress || "Memproses perubahan Anda..."}
        </p>
        <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-zinc-900 dark:bg-white rounded-full animate-pulse" style={{ width: "70%" }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Shared helper ────────────────────────────────────────────
function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{label}</span>
      {children}
    </div>
  );
}

// ── Public Request Confirmation Dialog ───────────────────────

interface PublicRequestDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function PublicRequestDialog({ open, onOpenChange, onConfirm }: PublicRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
            </div>
            Permintaan Quiz Publik
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed mt-2">
            Quiz Anda akan disimpan sebagai <span className="font-semibold text-zinc-800 dark:text-zinc-200">privat</span> terlebih dahulu dan menunggu persetujuan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  Proses Review
                </p>
                <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    Quiz akan direview oleh tim support kami
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    Setelah disetujui, quiz akan tampil secara publik
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    Anda akan mendapat notifikasi saat quiz disetujui
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hal ini dilakukan untuk memastikan konten quiz sesuai dengan pedoman komunitas kami.
          </p>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            <Globe className="w-3.5 h-3.5" />
            Ajukan sebagai Publik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
