"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { QuizStat } from "../types";

interface TopQuizzesTableProps {
  quizzes: QuizStat[];
  loading?: boolean;
  onQuizClick?: (quizId: string) => void;
}

function RankBadge({ rank }: { rank: number }) {
  const color =
    rank === 1 ? "bg-yellow-500"
    : rank === 2 ? "bg-gray-400"
    : rank === 3 ? "bg-amber-600"
    : "bg-blue-500";

  return (
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
      {rank}
    </div>
  );
}

export function TopQuizzesTable({ quizzes, loading, onQuizClick }: TopQuizzesTableProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Most Played Quiz</h2>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Play</TableHead>
              <TableHead>Avg. Score</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading quizzes...
                </TableCell>
              </TableRow>
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  Tidak ada kuis di rentang waktu ini.
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow
                  key={quiz.rank}
                  onClick={() => onQuizClick?.(quiz.id)}
                  className={onQuizClick ? "hover:bg-muted/50 cursor-pointer transition-colors" : ""}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <RankBadge rank={quiz.rank} />
                  </TableCell>
                  <TableCell>{quiz.name}</TableCell>
                  <TableCell>{quiz.plays.toLocaleString()}</TableCell>
                  <TableCell className="w-[200px]">
                    <span className="text-sm font-medium">{quiz.avgScore}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
