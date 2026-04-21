"use client";

import { useState, useEffect } from "react";
import { PaginationControl } from "@/components/pagination-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatTimeAgo, cn } from "@/lib/utils";
import { RoleBadge } from "./role-badge";
import { TABLE_ITEMS_PER_PAGE } from "../constants/filter-options";
import rawCategories from "@/data/categories.json";
import type { QuizHistory } from "../types";

const categoryMap: Record<string, string> = Object.fromEntries(
  rawCategories.map((c) => [c.id, c.title])
);

interface HistoryTableProps {
  data: QuizHistory[];
}

export function HistoryTable({ data }: HistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const startIndex   = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;
  const currentItems = data.slice(startIndex, startIndex + TABLE_ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quiz</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  You still haven't played any quiz.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item) => {
                const tooltipDate = new Date(item.ended_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                });
                const hostSuffix =
                  item.roles.includes("player") && item.hostName
                    ? ` (Host: ${item.hostName})`
                    : "";

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <TableCell
                      className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]"
                      title={item.quiztitle}>
                      {item.quiztitle}
                    </TableCell>

                    <TableCell title="Category">
                      {item.category
                        ? (categoryMap[item.category] || item.category)
                        : "-"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.roles.map((role) => (
                          <RoleBadge key={role} role={role} />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell title="Language">
                      {item.language ? item.language.toUpperCase() : "-"}
                    </TableCell>

                    <TableCell>{item.application}</TableCell>

                    <TableCell title={`${tooltipDate}${hostSuffix}`}>
                      {formatTimeAgo(item.ended_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && (
        <PaginationControl
          totalItems={data.length}
          currentPage={currentPage}
          itemsPerPage={TABLE_ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
