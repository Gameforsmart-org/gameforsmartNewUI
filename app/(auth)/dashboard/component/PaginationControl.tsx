"use client";

// ============================================================
// components/PaginationControl.tsx
// Kontrol halaman: Prev / angka / ellipsis/jump / Next
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE_BTN =
  "h-8 w-8 border-slate-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-orange-500 dark:hover:bg-orange-500 dark:hover:text-white";

interface PaginationControlProps {
  totalItems:   number;
  itemsPerPage: number;
  currentPage:  number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange
}: PaginationControlProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPage, setJumpPage]       = useState("");
  const [activeInput, setActiveInput] = useState<"left" | "right" | null>(null);

  if (totalPages <= 1) return null;

  const handleJumpSubmit = () => {
    const page = parseInt(jumpPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) onPageChange(page);
    setActiveInput(null);
    setJumpPage("");
  };

  const renderPageBtn = (page: number) => (
    <Button
      key={page}
      variant={currentPage === page ? "default" : "outline"}
      size="icon"
      className={`h-8 w-8 transition-colors ${
         currentPage === page
          ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600 hover:border-orange-600"
          : BASE_BTN
      }`}
      onClick={() => onPageChange(page)}
    >
      {page}
    </Button>
  );

  const renderEllipsis = (position: "left" | "right") => {
    if (activeInput === position) {
      return (
        <form
          key={position}
          onSubmit={(e) => { e.preventDefault(); handleJumpSubmit(); }}
          className="flex items-center"
        >
          <Input
            className={`h-8 w-8 ${BASE_BTN}`}
            autoFocus
            onBlur={() => setTimeout(() => setActiveInput(null), 200)}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
          />
        </form>
      );
    }
    return (
      <Button
        key={position}
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${BASE_BTN}`}
        onClick={() => { setActiveInput(position); setJumpPage(""); }}
      >
        ...
      </Button>
    );
  };

  const items: React.ReactNode[] = [];

  // Prev
  items.push(
    <Button
      key="prev"
      variant="outline"
      size="icon"
      className={`h-8 w-8 ${BASE_BTN}`}
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
    >
      &lt;
    </Button>
  );

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) items.push(renderPageBtn(i));
  } else {
    items.push(renderPageBtn(1));

    if (currentPage > 4) {
      items.push(renderEllipsis("left"));
    } else {
      for (let i = 2; i < Math.min(5, totalPages); i++) {
        if (i < Math.max(2, currentPage - 1)) items.push(renderPageBtn(i));
      }
    }

    let start = Math.max(2, currentPage - 1);
    let end   = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 4)              { start = 2; end = 4; }
    else if (currentPage >= totalPages - 3) { start = totalPages - 3; end = totalPages - 1; }

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) items.push(renderPageBtn(i));
    }

    if (currentPage < totalPages - 3) items.push(renderEllipsis("right"));
    items.push(renderPageBtn(totalPages));
  }

  // Next
  items.push(
    <Button
      key="next"
      variant="outline"
      size="icon"
      className={`h-8 w-8 ${BASE_BTN}`}
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
    >
      &gt;
    </Button>
  );

  return (
    <div className="mt-6 flex items-center justify-center gap-2">{items}</div>
  );
}
