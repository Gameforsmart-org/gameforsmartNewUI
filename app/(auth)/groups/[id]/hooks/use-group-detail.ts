"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useGroupActivities } from "@/hooks/useGroupActivities";
import { applyMemberAction } from "../../services/groups.service";
import { supabase } from "@/lib/supabase";
import type { DetailedMember, MemberAction } from "../../types";

export function useGroupDetail(group: any, members: DetailedMember[]) {
  const { profileId } = useAuth();
  const router = useRouter();
  const { logActivity } = useGroupActivities();

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [activityNames, setActivityNames] = useState<Record<string, string>>({});
  const [activityLimit, setActivityLimit] = useState(10);

  // Resolve names for activity log
  useEffect(() => {
    const activities: any[] = Array.isArray(group.activities) ? group.activities : [];
    if (activities.length === 0) return;

    const allIds = new Set<string>();
    activities.forEach((a: any) => {
      if (a.user_id) allIds.add(a.user_id);
      if (a.actor_id) allIds.add(a.actor_id);
    });

    const nameMap: Record<string, string> = {};
    members.forEach((m) => { nameMap[m.id] = m.name; });

    const missingIds = [...allIds].filter((id) => !nameMap[id]);
    if (missingIds.length === 0) {
      setActivityNames(nameMap);
      return;
    }

    supabase
      .from("profiles")
      .select("id, fullname, nickname")
      .in("id", missingIds)
      .then(({ data }) => {
        data?.forEach((p: any) => {
          nameMap[p.id] = p.fullname || p.nickname || "Unknown User";
        });
        setActivityNames({ ...nameMap });
      });
  }, [group.activities, members]);

  const handleAction = async (memberUserId: string, action: MemberAction) => {
    setLoadingActionId(memberUserId);
    try {
      await applyMemberAction(group.id, memberUserId, action);

      if (profileId) {
        await logActivity(group.id, memberUserId, profileId, action);
      }

      const label =
        action === "kick" ? "kicked" : action === "promote" ? "promoted" : "demoted";
      toast.success(`User ${label} successfully`);
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setLoadingActionId(null);
    }
  };

  return {
    profileId,
    loadingActionId,
    activityNames,
    activityLimit,
    setActivityLimit,
    handleAction
  };
}
