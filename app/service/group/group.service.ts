import { supabase } from "@/lib/supabase";

// ─── logGroupActivity ─────────────────────────────────────────

/**
 * Append activity to group's activities JSONB array.
 * Standalone function (no hook needed) for use in services.
 */
export async function logGroupActivity(
  groupId: string,
  userId: string,
  actorId: string,
  action: "join" | "kick" | "promote" | "demote" | "leave"
): Promise<void> {
  try {
    const { data: groupData } = await supabase
      .from("groups")
      .select("activities")
      .eq("id", groupId)
      .single();

    const currentActivities = Array.isArray(groupData?.activities)
      ? groupData.activities
      : [];

    const newActivity = {
      user_id: userId,
      actor_id: actorId,
      action,
      created_at: new Date().toISOString(),
    };

    await supabase
      .from("groups")
      .update({ activities: [...currentActivities, newActivity] })
      .eq("id", groupId);
  } catch (err) {
    console.error("[logGroupActivity] Error:", err);
  }
}
