import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import GroupDetail from "./component/detail";
import { getGroupById, getProfilesByIds } from "../services/groups.service";
import type { DetailedMember } from "../types";

export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/groups/${id}`);

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!userProfile) redirect("/groups");

  const currentUserXid = (userProfile as any).id;

  let group: any;
  try {
    group = await getGroupById(id);
  } catch {
    return <div>Groups not found or error loading groups.</div>;
  }

  // Resolve member IDs
  const members: any[] = Array.isArray(group.members) ? group.members : [];
  const memberIds: string[] = members
    .map((m: any) => (typeof m === "string" ? m : m.user_id || m.id))
    .filter((id: any) => typeof id === "string" && id.length > 0);

  // Guard: only members can access detail page
  if (!memberIds.includes(currentUserXid)) redirect("/groups");

  // Fetch profiles for all members
  const profiles = await getProfilesByIds(memberIds);

  // Build detailed members list
  const detailedMembers: DetailedMember[] = members.map((m: any) => {
    const memberId = typeof m === "string" ? m : m.user_id || m.id;
    const profile = profiles.find((p: any) => p.id === memberId);
    const rawRole = typeof m !== "string" && m.role ? m.role : "member";

    return {
      id: memberId,
      name: profile?.fullname || profile?.nickname || "Unknown User",
      username: profile?.username ? `@${profile.username}` : "@unknown",
      role: rawRole,
      avatar: profile?.avatar_url ?? null
    };
  });

  return <GroupDetail group={group} members={detailedMembers} />;
}
