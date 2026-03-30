"use client";

// ============================================================
// _components/steps/InfoStep.tsx  (Shadcn Admin style)
// Tab 1 – quiz title, description, category, language,
//          visibility toggle, cover image
// ============================================================

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { Quiz } from "../../types";

interface Category { value: string; label: string }
interface Language { value: string; label: string }

interface InfoStepProps {
  quiz: Quiz;
  categories: Category[];
  languages: Language[];
  onUpdate: (field: string, value: any) => void;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

export function InfoStep({ quiz, categories, languages, onUpdate }: InfoStepProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="grid gap-6 sm:grid-cols-2">

          {/* Title */}
          <Field label="Edit Quiz" className="sm:col-span-2">
            <Input
              id="edit-title"
              placeholder="Enter quiz title"
              value={quiz.title}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="h-9 text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
            />
          </Field>

          {/* Description */}
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              id="edit-description"
              placeholder="Enter quiz description"
              value={quiz.description || ""}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={3}
              className="text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 resize-none"
            />
          </Field>

          {/* Category */}
          <Field label="Category">
            <Select value={quiz.category || "general"} onValueChange={(v) => onUpdate("category", v)}>
              <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-sm">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Language */}
          <Field label="Language">
            <Select value={quiz.language || "id"} onValueChange={(v) => onUpdate("language", v)}>
              <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-sm">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Visibility */}
          <Field label="Visibility" className="sm:col-span-2">
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                {quiz.is_public
                  ? <Globe className="w-4 h-4 text-emerald-500" />
                  : <Lock className="w-4 h-4 text-zinc-400" />}
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {quiz.is_public
                      ? "Public"
                      : "Private"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {quiz.is_public
                      ? "Quiz akan diajukan untuk review dan menjadi publik setelah disetujui"
                      : "Only you can see this quiz"}
                  </p>
                </div>
              </div>
              <Switch
                checked={quiz.is_public}
                onCheckedChange={(checked) => onUpdate("is_public", checked)}
              />
            </div>
          </Field>

          {/* Cover image */}
          <Field label="Quiz Image" className="sm:col-span-2">
            <ImageUpload
              imageUrl={quiz.image_url || null}
              onImageChange={(url) => onUpdate("image_url", url)}
              label=""
              className="w-full max-w-sm"
            />
          </Field>

        </div>
      </div>
    </div>
  );
}
