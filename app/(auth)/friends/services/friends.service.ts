import { supabase } from "@/lib/supabase";
import type { Profile, TabKey } from "../types";
import type { LocationValue } from "@/components/ui/location-selector";

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

/**
 * Ambil daftar ID profil yang sudah di-follow oleh user.
 */
export async function getFollowedIds(currentUserId: string): Promise<string[]> {
  const { data } = await supabase
    .from("friendships")
    .select("addressee_id")
    .eq("requester_id", currentUserId);

  return data?.map((item) => item.addressee_id) ?? [];
}

/**
 * Ambil ID profil berdasarkan relasi tab yang aktif:
 * - friends   → mutual follow (following ∩ follower)
 * - following → yang di-follow oleh user
 * - follower  → yang mem-follow user
 * - find      → tidak butuh pre-fetch ID (query langsung ke profiles)
 */
export async function getProfileIdsByTab(
  currentUserId: string,
  tab: TabKey
): Promise<string[]> {
  switch (tab) {
    case "friends": {
      const [{ data: following }, { data: followers }] = await Promise.all([
        supabase
          .from("friendships")
          .select("addressee_id")
          .eq("requester_id", currentUserId),
        supabase
          .from("friendships")
          .select("requester_id")
          .eq("addressee_id", currentUserId)
      ]);
      const followingIds = following?.map((f) => f.addressee_id) ?? [];
      const followerIds = followers?.map((f) => f.requester_id) ?? [];
      return followingIds.filter((id) => followerIds.includes(id));
    }

    case "following": {
      const { data } = await supabase
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", currentUserId);
      return data?.map((f) => f.addressee_id) ?? [];
    }

    case "follower": {
      const { data } = await supabase
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", currentUserId);
      return data?.map((f) => f.requester_id) ?? [];
    }

    default:
      return [];
  }
}

export interface GetProfilesOptions {
  tab: TabKey;
  currentUserId: string;
  profileIds?: string[];
  search?: string;
  locationFilter?: Pick<LocationValue, "countryId" | "stateId" | "cityId">;
}

/**
 * Ambil daftar profil lengkap (dengan relasi countries/states/cities)
 * berdasarkan filter tab, search text, dan lokasi.
 */
export async function getProfiles({
  tab,
  currentUserId,
  profileIds = [],
  search = "",
  locationFilter
}: GetProfilesOptions): Promise<Profile[]> {
  let query = supabase.from("profiles").select(`
    *,
    countries (name),
    states (name),
    cities (name)
  `);

  if (tab === "find") {
    query = query.neq("id", currentUserId);
  } else {
    if (profileIds.length === 0) return [];
    query = query.in("id", profileIds);
  }

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,fullname.ilike.%${search}%,nickname.ilike.%${search}%`
    );
  }

  if (locationFilter?.countryId) query = query.eq("country_id", locationFilter.countryId);
  if (locationFilter?.stateId)   query = query.eq("state_id",   locationFilter.stateId);
  if (locationFilter?.cityId)    query = query.eq("city_id",    locationFilter.cityId);

  const { data, error } = await query;
  if (error) throw error;

  return (data as Profile[]) ?? [];
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

/**
 * Follow seorang user (insert ke tabel friendships).
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase.from("friendships").insert({
    requester_id: currentUserId,
    addressee_id: targetUserId,
    status: "accepted"
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

/**
 * Unfollow seorang user (hapus baris di friendships dari sisi requester).
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", currentUserId)
    .eq("addressee_id", targetUserId);
  if (error) throw error;
}

/**
 * Hapus follower (hapus baris di friendships dari sisi targetUser sebagai requester).
 */
export async function removeFollower(
  currentUserId: string,
  followerUserId: string
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", followerUserId)
    .eq("addressee_id", currentUserId);
  if (error) throw error;
}
