"use client";

// ============================================================
// hooks/useGroupActivities.ts
//
// React hook wrapper around logGroupActivity service function.
// Used in components that need to log group activities
// (join, kick, promote, demote) to the groups.activities JSONB.
//
// For non-hook contexts (services, server code), import
// logGroupActivity directly from notificationService.
// ============================================================

import { useCallback } from "react";
import { logGroupActivity } from "@/app/service/group/group.service";

export type GroupActivityAction = "join" | "kick" | "promote" | "demote" | "leave";

/**
 * Hook that provides a function to log activities on a group.
 *
 * Usage:
 *   const { logActivity } = useGroupActivities();
 *   await logActivity(groupId, targetUserId, actorUserId, "kick");
 */
export function useGroupActivities() {
  const logActivity = useCallback(
    async (
      groupId: string,
      userId: string,
      actorId: string,
      action: GroupActivityAction
    ) => {
      await logGroupActivity(groupId, userId, actorId, action);
    },
    []
  );

  return { logActivity };
}
