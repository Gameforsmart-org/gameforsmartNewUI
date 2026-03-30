// ============================================================
// page.tsx  –  Edit Quiz route entry point
//
// Kept deliberately thin: wraps the async params in
// QuizPageWithLoading, then delegates everything to
// EditQuizContent which uses the useEditQuiz hook.
// ============================================================

// import { QuizPageWithLoading } from "@/components/ui/page-with-loading";
import { EditQuizContent } from "./component/EditQuizContent";

export default function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <EditQuizContent params={params} />
    </div>
  );
}
