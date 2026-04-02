import { getProfileData } from "@/app/service/profile/profile.service"
import { ProfileView } from "./component/profile-view"
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Profile",
    description:
      "Profile page",
    canonical: "/profile"
  });
}

export default async function Page() {
  const data = await getProfileData()

  return (
    <div className="container mx-auto py-10">
      <ProfileView data={data} />
    </div>
  )
}