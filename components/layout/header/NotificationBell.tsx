"use client";

// ============================================================
// notifications/_components/NotificationBell.tsx
// Bell icon + dropdown untuk header.
// Menggunakan useNotifications hook (shared dengan halaman).
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { BellIcon, ClockIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import {
  NotificationTitle,
  NotificationDescription,
  ActionButtons,
  getTimeAgo,
} from "@/components/NotificationItem";

export function NotificationBell() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const {
    notifications,
    hasUnread,
    unreadCount,
    actionLoading,
    handleAction,
    handleHeaderOpen,
  } = useNotifications("header");

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" className="relative">
        <BellIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleHeaderOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <BellIcon className="animate-tada" />
          {hasUnread && (
            <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        {/* Header */}
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex justify-between border-b px-6 py-4">
            <div className="font-medium text-sm">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs text-zinc-400">({unreadCount})</span>
              )}
            </div>
            <Button variant="link" className="relative h-auto p-0 text-xs" size="sm" asChild>
              <Link href="/notifications">
                View all
                {hasUnread && (
                  <span className="bg-destructive absolute -top-1 -right-2 block size-2 shrink-0 rounded-full" />
                )}
              </Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        {/* List (top 5) */}
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">No notifications</div>
          ) : (
            notifications.slice(0, 5).map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={(e) => e.preventDefault()}
                className="group flex cursor-pointer items-start gap-3 rounded-none border-b px-4 py-3"
              >
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <NotificationTitle item={item} />
                  <NotificationDescription item={item} />

                  <ActionButtons
                    item={item}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                    variant="dropdown"
                  />

                  <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                    <ClockIcon className="size-3" />
                    {getTimeAgo(item.created_at)}
                  </div>
                </div>

                {!item.is_read && (
                  <span className="bg-destructive/80 mt-1 block size-2 shrink-0 rounded-full border" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
