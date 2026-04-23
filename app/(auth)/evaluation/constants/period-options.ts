import type { ApplicationInfo, PeriodFilter } from "../types";

// ─── Period Filter Options ────────────────────────────────────────────────────

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "today",      label: "Today" },
  { value: "yesterday",  label: "Yesterday" },
  { value: "this_week",  label: "This Week" },
  { value: "last_week",  label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year",  label: "This Year" },
  { value: "last_year",  label: "Last Year" }
];

// ─── Application Info Map ─────────────────────────────────────────────────────

const APPLICATION_MAP: Record<string, ApplicationInfo> = {
  "gameforsmart.com": {
    name: "GameForSmart",
    shortName: "GFS",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
  },
  "space-quiz": {
    name: "Space Quiz",
    shortName: "SQ",
    colorClass: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
  },
  "quiz-rush": {
    name: "Quiz Rush",
    shortName: "QR",
    colorClass: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
  },
  crazyrace: {
    name: "Crazy Race",
    shortName: "CR",
    colorClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
  },
  memoryquiz: {
    name: "Memory Quiz",
    shortName: "MQ",
    colorClass: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
  },
  "horror-quiz": {
    name: "Horror Quiz",
    shortName: "HQ",
    colorClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
  }
};

const FALLBACK_APP: ApplicationInfo = {
  name: "Unknown",
  shortName: "?",
  colorClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
};

export function getApplicationInfo(application?: string): ApplicationInfo {
  if (!application) return FALLBACK_APP;
  return (
    APPLICATION_MAP[application] || {
      name: application,
      shortName: application.substring(0, 3).toUpperCase(),
      colorClass: "bg-gray-100 text-gray-700 border-gray-200"
    }
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export const ITEMS_PER_PAGE = 10;
