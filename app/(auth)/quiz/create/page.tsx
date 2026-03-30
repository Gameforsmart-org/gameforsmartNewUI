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
      "Create a new quiz with your own questions and answers.",
    canonical: "/quiz/create"
  });
}

export default function CreateQuizPage() {
  return <CreateQuizLayout />;
}
