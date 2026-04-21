"use client";

import { useState, useEffect } from "react";
import { PaginationControl } from "@/components/pagination-control";
import { HistoryCardItem } from "./history-card-item";
import { EmptyState } from "./empty-state";
import { CARD_ITEMS_PER_PAGE } from "../constants/filter-options";
import type { QuizHistory } from "../types";

interface HistoryCardProps {
  quiz: QuizHistory[];
}

export function HistoryCard({ quiz }: HistoryCardProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the quiz list changes (filter applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [quiz]);

  const startIndex   = (currentPage - 1) * CARD_ITEMS_PER_PAGE;
  const currentItems = quiz.slice(startIndex, startIndex + CARD_ITEMS_PER_PAGE);

  if (quiz.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((item) => (
          <HistoryCardItem key={item.id} quiz={item} />
        ))}
      </div>

      <PaginationControl
        totalItems={quiz.length}
        currentPage={currentPage}
        itemsPerPage={CARD_ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
