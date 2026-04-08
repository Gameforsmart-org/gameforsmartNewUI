"use client";

// ============================================================
// components/dialog-notification/dialog-notification.tsx
//
// Dialog popup for incoming session notifications.
// Shows on all pages EXCEPT /host and /player.
// Listens for new session-type notifications via Supabase Realtime,
// enriches them, and shows a dialog with Accept/Decline buttons.
// ============================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotificationTitle,
  NotificationDescription,
  ActionButtons,
  getTimeAgo,
} from "@/components/NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import { ClockIcon, Gamepad2 } from "lucide-react";
import type { Notification, SessionEntity } from "@/types/notifications";

export function DialogNotification() {
  const { profileId } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingNotif, setPendingNotif] = useState<Notification | null>(null);
  const processedIds = useRef<Set<string>>(new Set());

  const { handleAction, actionLoading } = useNotifications("dialog-notif");

  // Excluded paths: /host and /player
  const isExcluded =
    pathname.startsWith("/host") || pathname.startsWith("/player");

  // Enrich raw notification payload into Notification shape
  const enrichNotification = useCallback(
    async (raw: any): Promise<Notification | null> => {
      try {
        // Only handle session types
        if (raw.type !== "sessionGroup" && raw.type !== "sessionFriend") {
          return null;
        }

        // Fetch actor name
        let actorName = "User";
        if (raw.actor_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, nickname, fullname")
            .eq("id", raw.actor_id)
            .single();
          if (profile) {
            actorName = profile.nickname || profile.fullname || "User";
          }
        }

        // Fetch session data
        let sessionEntity: SessionEntity = {
          name: "Unknown Session",
          code: "N/A",
          application: "N/A",
        };
        if (raw.entity_id) {
          const { data: session } = await supabase
            .from("game_sessions")
            .select(
              "id, game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)"
            )
            .eq("id", raw.entity_id)
            .single();
          if (session) {
            const quizData = (session as any).quizzes;
            const title = Array.isArray(quizData)
              ? quizData[0]?.title
              : quizData?.title;
            sessionEntity = {
              name: title || "Unknown Quiz",
              code: (session as any).game_pin || "N/A",
              application: (session as any).application || "N/A",
            };
          }
        }

        // Fetch group name for sessionGroup type
        let fromGroupId: any = raw.from_group_id;
        if (raw.type === "sessionGroup" && raw.from_group_id) {
          const { data: group } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", raw.from_group_id)
            .single();
          if (group) {
            fromGroupId = group.name;
          }
        }

        const notification: Notification = {
          id: raw.id,
          user_id: raw.user_id,
          actor_id: actorName,
          type: raw.type,
          entity_type: raw.entity_type,
          entity_id: sessionEntity,
          from_group_id: fromGroupId,
          raw_from_group_id: raw.from_group_id,
          status: raw.status,
          content: raw.content,
          is_read: raw.is_read || false,
          created_at: raw.created_at,
        };

        return notification;
      } catch (err) {
        console.error("[DialogNotification] enrich error:", err);
        return null;
      }
    },
    []
  );

  // Listen for new session notifications
  useEffect(() => {
    if (!profileId || isExcluded) return;

    const channel = supabase
      .channel(`dialog-session-notif:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`,
        },
        async (payload) => {
          const raw = payload.new as any;

          // Only show dialog for session types
          if (
            raw.type !== "sessionGroup" &&
            raw.type !== "sessionFriend"
          ) {
            return;
          }

          // Skip if already processed
          if (processedIds.current.has(raw.id)) return;
          processedIds.current.add(raw.id);

          const enriched = await enrichNotification(raw);
          if (enriched) {
            setPendingNotif(enriched);
            setOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, isExcluded, enrichNotification]);

  // Wrap handleAction to close dialog after action
  const onAction = useCallback(
    async (item: Notification, action: "accepted" | "declined") => {
      await handleAction(item, action);
      setOpen(false);
      setPendingNotif(null);
    },
    [handleAction]
  );

  if (isExcluded || !pendingNotif) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setPendingNotif(null);
    }}>
      <DialogContent className="dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Gamepad2 size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            Session Invitation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Notification content */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-1.5">
              <NotificationTitle item={pendingNotif} />
              <NotificationDescription item={pendingNotif} />
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
                <ClockIcon className="size-3" />
                {getTimeAgo(pendingNotif.created_at)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end">
            <ActionButtons
              item={pendingNotif}
              actionLoading={actionLoading}
              onAction={onAction}
              variant="page"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
