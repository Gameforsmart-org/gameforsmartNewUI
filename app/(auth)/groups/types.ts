// ─── Group Types ─────────────────────────────────────────────────────────────

export interface GroupCreator {
  fullname: string | null;
  nickname: string | null;
  username: string | null;
  avatar_url?: string | null;
  city?: { name: string } | null;
  state?: { name: string } | null;
}

export interface GroupData {
  id: string;
  name: string;
  category: string | null;
  description?: string | null;
  members: any[]; // JSONB
  join_requests: any[]; // JSONB
  activities?: any[]; // JSONB
  settings: {
    status: "public" | "private" | "secret";
    admins_approval: boolean;
  };
  created_at: string | null;
  creator_id?: string;
  creator: GroupCreator | null;
}

// ─── Member Types ─────────────────────────────────────────────────────────────

export type MemberRole = "owner" | "admin" | "member";

export type MemberAction = "kick" | "promote" | "demote";

export interface DetailedMember {
  id: string;
  name: string;
  username: string;
  role: MemberRole;
  avatar: string | null;
}

// ─── Category Options ────────────────────────────────────────────────────────

export interface CategoryOption {
  value: string;
  labelId: string;
  labelEn: string;
}

export const GROUP_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "Campus",                  labelId: "Kampus",          labelEn: "Campus" },
  { value: "Office",                  labelId: "Kantor",          labelEn: "Office" },
  { value: "Family",                  labelId: "Keluarga",        labelEn: "Family" },
  { value: "Community",               labelId: "Komunitas",       labelEn: "Community" },
  { value: "Mosque",                  labelId: "Masjid/Musholla", labelEn: "Mosque" },
  { value: "Islamic Boarding School", labelId: "Pesantren",       labelEn: "Islamic Boarding School" },
  { value: "School",                  labelId: "Sekolah",         labelEn: "School" },
  { value: "Quran Learning Center",   labelId: "TPA/TPQ",         labelEn: "Quran Learning Center" },
  { value: "General",                 labelId: "Umum",            labelEn: "General" },
  { value: "Others",                  labelId: "Lainnya",         labelEn: "Others" }
];
