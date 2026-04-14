import { supabase } from "@/lib/supabase";
import type { GroupData } from "../types";

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

/**
 * Ambil semua group beserta data creator-nya.
 */
export async function getAllGroups(): Promise<GroupData[]> {
  const { data, error } = await supabase.from("groups").select(`
    *,
    creator:creator_id (
      fullname,
      nickname,
      username,
      avatar_url,
      city:cities (name),
      state:states (name)
    )
  `);

  if (error) throw error;
  return (data as GroupData[]) ?? [];
}

/**
 * Ambil satu group berdasarkan ID.
 */
export async function getGroupById(groupId: string): Promise<GroupData> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) throw error;
  return data as GroupData;
}

/**
 * Ambil profil user berdasarkan array of IDs (untuk member list).
 */
export async function getProfilesByIds(
  ids: string[]
): Promise<{ id: string; fullname: string | null; nickname: string | null; username: string | null; avatar_url: string | null }[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, fullname, nickname, username, avatar_url")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

/**
 * Cari profil user berdasarkan keyword (untuk fitur Add Member).
 */
export async function searchProfiles(keyword: string) {
  const term = `%${keyword}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("*, state:states(name), city:cities(name)")
    .or(`nickname.ilike.${term},fullname.ilike.${term},username.ilike.${term}`)
    .limit(20);

  if (error) {
    // Fallback tanpa relasi jika relasi gagal
    const { data: fallback, error: fallbackError } = await supabase
      .from("profiles")
      .select("*")
      .or(`nickname.ilike.${term},fullname.ilike.${term},username.ilike.${term}`)
      .limit(20);

    if (fallbackError) throw fallbackError;
    return fallback ?? [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export interface CreateGroupPayload {
  name: string;
  category: string;
  description: string | null;
  creator_id: string;
  status: "public" | "private" | "secret";
}

/**
 * Buat group baru. Creator otomatis masuk sebagai member dengan role "owner".
 */
export async function createGroup(payload: CreateGroupPayload): Promise<void> {
  const { error } = await supabase.from("groups").insert({
    name: payload.name,
    category: payload.category,
    description: payload.description,
    creator_id: payload.creator_id,
    members: [{ role: "owner", user_id: payload.creator_id }],
    settings: {
      status: payload.status,
      admins_approval: payload.status !== "public"
    }
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────

export interface UpdateGroupSettingsPayload {
  groupId: string;
  name: string;
  category: string;
  description: string;
  status: string;
  adminsApproval: boolean;
  currentSettings: any;
}

/**
 * Update nama, kategori, deskripsi, dan settings group.
 */
export async function updateGroupSettings(payload: UpdateGroupSettingsPayload): Promise<void> {
  const { error } = await supabase
    .from("groups")
    .update({
      name: payload.name,
      category: payload.category,
      description: payload.description,
      settings: {
        ...payload.currentSettings,
        status: payload.status,
        admins_approval: payload.adminsApproval
      }
    })
    .eq("id", payload.groupId);

  if (error) throw error;
}

/**
 * Update daftar members di group (digunakan untuk join, leave, kick, promote, demote).
 */
export async function updateGroupMembers(groupId: string, members: any[]): Promise<void> {
  const { error } = await supabase
    .from("groups")
    .update({ members })
    .eq("id", groupId);

  if (error) throw error;
}

/**
 * Join group langsung (untuk group public tanpa approval).
 * Fetch members terbaru terlebih dahulu untuk menghindari race condition.
 */
export async function joinGroup(groupId: string, profileId: string): Promise<void> {
  const { data: groupData, error: fetchError } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single();

  if (fetchError) throw fetchError;

  const members: any[] = Array.isArray(groupData.members) ? groupData.members : [];
  const isAlreadyMember = members.some(
    (m: any) => m.user_id === profileId || m.id === profileId
  );

  if (isAlreadyMember) throw new Error("already_member");

  await updateGroupMembers(groupId, [...members, { role: "member", user_id: profileId }]);
}

/**
 * Kirim request join (untuk group dengan admins approval).
 */
export async function requestJoinGroup(groupId: string, profileId: string): Promise<void> {
  const { data: groupData, error: fetchError } = await supabase
    .from("groups")
    .select("join_requests")
    .eq("id", groupId)
    .single();

  if (fetchError) throw fetchError;

  const requests: any[] = Array.isArray(groupData.join_requests) ? groupData.join_requests : [];
  const alreadyRequested = requests.some(
    (r: any) => r.user_id === profileId && r.status === "pending"
  );

  if (alreadyRequested) throw new Error("already_requested");

  const updatedRequests = [
    ...requests,
    { status: "pending", user_id: profileId, requested_at: new Date().toISOString() }
  ];

  const { error } = await supabase
    .from("groups")
    .update({ join_requests: updatedRequests })
    .eq("id", groupId);

  if (error) throw error;
}

/**
 * Batalkan request join yang masih pending.
 */
export async function cancelJoinRequest(groupId: string, profileId: string): Promise<void> {
  const { data: groupData, error: fetchError } = await supabase
    .from("groups")
    .select("join_requests")
    .eq("id", groupId)
    .single();

  if (fetchError) throw fetchError;

  const requests: any[] = Array.isArray(groupData.join_requests) ? groupData.join_requests : [];
  const updatedRequests = requests.filter(
    (r: any) => !(r.user_id === profileId && r.status === "pending")
  );

  const { error } = await supabase
    .from("groups")
    .update({ join_requests: updatedRequests })
    .eq("id", groupId);

  if (error) throw error;
}

/**
 * Approve atau reject join request.
 */
export async function handleJoinRequest(
  groupId: string,
  targetUserId: string,
  decision: "approved" | "rejected"
): Promise<void> {
  const { data: groupData, error: fetchError } = await supabase
    .from("groups")
    .select("join_requests, members")
    .eq("id", groupId)
    .single();

  if (fetchError) throw fetchError;

  const currentRequests: any[] = Array.isArray(groupData.join_requests)
    ? groupData.join_requests
    : [];
  const currentMembers: any[] = Array.isArray(groupData.members) ? groupData.members : [];

  const updatedRequests = currentRequests.map((r: any) => {
    const rId = typeof r.user_id === "string" ? r.user_id : r.user_id?.id;
    return rId === targetUserId && r.status === "pending" ? { ...r, status: decision } : r;
  });

  let updatedMembers = currentMembers;
  if (decision === "approved") {
    const isMember = currentMembers.some((m: any) => {
      const mId = typeof m === "string" ? m : m.user_id || m.id;
      return mId === targetUserId;
    });
    if (!isMember) {
      updatedMembers = [...currentMembers, { user_id: targetUserId, role: "member" }];
    }
  }

  const { error } = await supabase
    .from("groups")
    .update({ join_requests: updatedRequests, members: updatedMembers })
    .eq("id", groupId);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Delete / Member actions
// ─────────────────────────────────────────────

/**
 * Leave group — hapus diri sendiri dari members.
 */
export async function leaveGroup(
  groupId: string,
  profileId: string,
  currentMembers: any[]
): Promise<void> {
  const members = Array.isArray(currentMembers) ? currentMembers : [];
  const updatedMembers = members.filter((m: any) => {
    const memberId = typeof m === "string" ? m : m.user_id || m.id;
    return memberId !== profileId;
  });

  await updateGroupMembers(groupId, updatedMembers);
}

export type MemberAction = "kick" | "promote" | "demote";

/**
 * Lakukan aksi terhadap member: kick, promote ke admin, atau demote ke member.
 * Fetch members terbaru untuk menghindari race condition.
 */
export async function applyMemberAction(
  groupId: string,
  targetUserId: string,
  action: MemberAction
): Promise<void> {
  const { data: groupData, error: fetchError } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single();

  if (fetchError) throw fetchError;

  let members: any[] = groupData.members || [];
  const isMatch = (m: any) => (m.user_id || m.id) === targetUserId;

  if (action === "kick") {
    members = members.filter((m: any) => !isMatch(m));
  } else if (action === "promote") {
    members = members.map((m: any) => (isMatch(m) ? { ...m, role: "admin" } : m));
  } else if (action === "demote") {
    members = members.map((m: any) => (isMatch(m) ? { ...m, role: "member" } : m));
  }

  await updateGroupMembers(groupId, members);
}
