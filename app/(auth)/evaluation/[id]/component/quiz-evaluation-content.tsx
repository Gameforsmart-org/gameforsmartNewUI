"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { SessionTable } from "./session-table";
import { useQuizEvaluation } from "../hooks/use-quiz-evaluation";

interface QuizEvaluationContentProps {
  params: Promise<{ id: string }>;
}

export function QuizEvaluationContent({ params }: QuizEvaluationContentProps) {
  const {
    loading,
    loadingData,
    quizTitle,
    sessions,
    paginatedSessions,
    currentPage, setCurrentPage,
    totalPages,
    getPeriodLabel,
    handleSessionClick
  } = useQuizEvaluation(params);

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/evaluation"
                className="hover:text-orange-600 dark:hover:text-orange-400">
                Evaluation
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="truncate text-2xl font-bold sm:text-3xl" title={quizTitle}>
          {loadingData ? <Skeleton className="h-8 w-48" /> : quizTitle}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Periode: {getPeriodLabel()}</p>
      </div>

      {/* Sessions Card */}
      <Card className="rounded-2xl border border-gray-100 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Permainan ({sessions.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <SessionTable
            sessions={sessions}
            paginatedSessions={paginatedSessions}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loadingData}
            onPageChange={setCurrentPage}
            onSessionClick={handleSessionClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
