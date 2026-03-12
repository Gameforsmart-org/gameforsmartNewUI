// ============================================================
// page.tsx  (Server Component)
//
// Tanggung jawab:
//   1. Fetch semua data via dashboardService.fetchDashboardData
//   2. Siapkan categories dari JSON lokal
//   3. Render <DashboardContent> dengan data sebagai props
//
// Tidak ada logika bisnis di sini — semua ada di service & hook.
// ============================================================

import { generateMeta } from "@/lib/utils";
import rawCategories from "@/data/categories.json";
import { createClient } from "@/lib/supabase-server";
import { fetchDashboardData } from "./services/dashboardService";
import { DashboardContent } from "./component";
import type { Category } from "./component/types";
import type { CategoryIconName } from "./component/quiz-icons";

export async function generateMetadata() {
  return generateMeta({
    title: "Dashboard",
    description:
      "The admin dashboard template offers a sleek and efficient interface for monitoring important data and user interactions. Built with shadcn/ui.",
    canonical: "/dashboard"
  });
}

export default async function Page() {
  const supabase = await createClient();

  let dashboardData;
  try {
    dashboardData = await fetchDashboardData(supabase);
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return <div>Error loading quizzes. Please try again later.</div>;
  }

  const categories: Category[] = rawCategories.map((cat) => ({
    ...cat,
    icon: cat.icon as CategoryIconName
  }));

  return (
    <DashboardContent
      publicQuizzes={dashboardData.publicQuizzes}
      myQuizzes={dashboardData.myQuizzes}
      favoriteQuizzes={dashboardData.favoriteQuizzes}
      categories={categories}
      currentProfileId={dashboardData.currentProfileId}
    />
  );
}
