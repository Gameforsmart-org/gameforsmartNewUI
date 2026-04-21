import { cn } from "@/lib/utils";
import type { QuizActivityType } from "../types";

interface RoleBadgeProps {
  role: QuizActivityType;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase inline-flex items-center",
        role === "host"
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      )}>
      {role}
    </span>
  );
}
