import { QuizEvaluationContent } from "./component/quiz-evaluation-content";

export default function QuizEvaluationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <QuizEvaluationContent params={params} />;
}
