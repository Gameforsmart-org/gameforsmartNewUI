export interface Profile {
  id: string;
  username: string;
  fullname: string | null;
  nickname: string | null;
  avatar_url: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  countries?: { name: string } | null;
  states?: { name: string } | null;
  cities?: { name: string } | null;
}

export type TabKey = "friends" | "following" | "follower" | "find";

export const TAB_LIST: { value: TabKey; label: string }[] = [
  { value: "friends", label: "Friends" },
  { value: "following", label: "Following" },
  { value: "follower", label: "Follower" },
  { value: "find", label: "Find People" }
];
