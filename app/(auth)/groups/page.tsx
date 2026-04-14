import { generateMeta } from "@/lib/utils";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Header from "./component/header";
import { getAllGroups } from "./services/groups.service";
import type { GroupData } from "./types";

export async function generateMetadata() {
  return generateMeta({
    title: "Groups",
    description:
      "A groups page is a page that displays all the groups that the user is a member of and groups that the user can join.",
    canonical: "/groups"
  });
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/groups");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single<{ id: string }>();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  let allGroups: GroupData[] = [];
  try {
    allGroups = await getAllGroups();
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  const discoverGroups: GroupData[] = [];
  const myGroups: GroupData[] = [];

  allGroups.forEach((group) => {
    const members = Array.isArray(group.members) ? group.members : [];
    const isMember = members.some((m: any) => {
      if (typeof m === "string") return m === profile.id;
      return m.user_id === profile.id || m.id === profile.id;
    });

    const status = group.settings?.status;

    if (isMember) {
      myGroups.push(group);
    } else if (status === "public" || status === "private") {
      discoverGroups.push(group);
    }
  });

  return <Header discoverGroups={discoverGroups} myGroups={myGroups} />;
}
