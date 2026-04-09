// ============================================================
// page.tsx — Quiz Detail (Server Component)
// Extracts params server-side and passes quizId to client component.
// ============================================================

import type { Metadata } from "next";
import QuizDetail from "./components/Quizdetail";

export const metadata: Metadata = {
  title: "Quiz Detail | Game For Smart",
  description: "View quiz details, statistics, and questions.",
};

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <QuizDetail quizId={id} />;
}