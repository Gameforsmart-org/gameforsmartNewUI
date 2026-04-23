"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Calendar, ChevronRight, Target, Users } from "lucide-react";
import { getApplicationInfo } from "../../constants/period-options";
import type { SessionData } from "../../types";

// ─── Date formatter ───────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} ${hh}.${mm}`;
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function SessionPagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SessionTableProps {
  sessions: SessionData[];
  paginatedSessions: SessionData[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (p: number) => void;
  onSessionClick: (sessionId: string) => void;
}

export function SessionTable({
  sessions,
  paginatedSessions,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onSessionClick
}: SessionTableProps) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aplikasi</TableHead>
            <TableHead className="text-center">Pemain</TableHead>
            <TableHead className="text-right">Skor</TableHead>
            <TableHead className="text-right">Skor Tertinggi</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </TableCell>
              </TableRow>
            ))
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Belum ada sesi permainan untuk periode ini</p>
              </TableCell>
            </TableRow>
          ) : (
            paginatedSessions.map((session) => {
              const appInfo = getApplicationInfo(session.application);
              return (
                <TableRow
                  key={session.session_id}
                  onClick={() => onSessionClick(session.session_id)}
                  className="cursor-pointer">
                  <TableCell className="p-0 text-sm text-gray-600 sm:p-4">
                    {formatDate(session.play_date)}
                  </TableCell>

                  <TableCell className="p-0 text-center sm:p-4 sm:text-left">
                    <Badge className={`text-xs ${appInfo.colorClass}`}>
                      <span className="hidden sm:inline">{appInfo.name}</span>
                      <span className="sm:hidden">{appInfo.shortName}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {session.participant_count}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-800">
                      <Target className="h-4 w-4 text-yellow-500" />
                      {session.user_score}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-green-600">
                      <Target className="h-4 w-4 text-green-500" />
                      {session.highest_score}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <SessionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}
