// ============================================================
// page.tsx  (Next.js App Router page entry point)
//
// Minimal entry – logic is in _hooks/useCreateQuiz.ts
// UI is in _components/CreateQuizLayout.tsx
// ============================================================
import { CreateQuizLayout } from "./component/CreateQuizLayout";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Create Quiz",
    description:
      "The admin dashboard template offers a sleek and efficient interface for monitoring important data and user interactions. Built with shadcn/ui.",
    canonical: "/create"
  });
}

export default function CreateQuizPage() {
  return <CreateQuizLayout />;
}
