"use client";

// ============================================================
// _components/EditQuizContent.tsx
// Resolves async params, calls useEditQuiz once, handles
// loading/not-found, then renders EditQuizLayout.
// ============================================================

import { use } from "react";
import { useEditQuiz } from "../hooks/useEditQuiz";
import { EditQuizLayout } from "./EditQuizLayout";
import { LoadingState, NotFoundState } from "./EditQuizStatus";

interface EditQuizContentProps {
  params: Promise<{ id: string }>;
}

export function EditQuizContent({ params }: EditQuizContentProps) {
  const { id } = use(params);
  const editQuiz = useEditQuiz(id);

  if (editQuiz.loading || editQuiz.authLoading) {
    return (
      <LoadingState
        authLoading={editQuiz.authLoading}
        savingProgress={editQuiz.savingProgress}
      />
    );
  }

  if (!editQuiz.quiz) return <NotFoundState />;

  return <EditQuizLayout editQuiz={editQuiz} />;
}
